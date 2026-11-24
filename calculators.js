'use strict';

const temperProtection=[
  [18,22,26,30,40,50,100],[16,20,25,30,40,50,100],[14,19,24,30,40,50,100],
  [12,18,24,30,40,50,100],[11,17,23,30,40,50,100],[10,15,20,25,35,50,100],
  [8,13,19,25,35,50,100],[6,10,15,20,30,50,100],[4,8,12,18,25,50,100],[2,4,8,12,25,50,100]
];
const ruNumber=new Intl.NumberFormat('ru',{maximumFractionDigits:2});

function calculatorField(label,control){
  const field=gearNode('label');
  field.append(gearNode('span',label),control);
  return field;
}

function calculatorNumber(value,min=0,max=1e9,step='any'){
  const input=gearNode('input');
  Object.assign(input,{type:'number',value,min,max,step,inputMode:step===1?'numeric':'decimal'});
  return input;
}

function calculatorSelect(choices){
  const select=gearNode('select');
  for(const [value,label] of choices){
    const option=gearNode('option',label);
    option.value=value;
    select.append(option);
  }
  return select;
}

function temperForecast(from,to,rows,paidFailures=0){
  const count=Array(25).fill(0);
  let required=from;
  while(required>0&&rows[required].rollback)required--;
  for(let level=required;level<to;level++){
    const row=rows[level];
    const chance=Math.min(100,row.chance+row.bonus)/100;
    if(level<15){
      if(!(chance>0))return {missing:level};
      count[level]=1/chance;
      continue;
    }
    const first=level===from?paidFailures:0;
    let remaining=1;
    for(let attempt=first;attempt<7;attempt++){
      count[level]+=remaining;
      const delta=temperProtection[level-15][attempt]-temperProtection[level-15][0];
      const probability=attempt===6?1:Math.min(1,(row.chance+row.bonus+delta)/100);
      remaining*=1-probability;
    }
  }
  for(let level=required;level<from;level++)count[level]=0;
  for(let level=to-1;level>required;level--){
    const row=rows[level];
    if(row.rollback){
      const chance=Math.min(100,row.chance+row.bonus)/100;
      const lowerChance=Math.min(100,rows[level-1].chance+rows[level-1].bonus)/100;
      count[level-1]+=count[level]*(1-chance)/lowerChance;
    }
  }
  return {count};
}

function mountTemperCalculator(view){
  const calc=view.querySelector('#calc-temper');
  const start=calculatorNumber(0,0,24,1), target=calculatorNumber(15,1,25,1);
  const prior=calculatorNumber(0,0,6,1);
  calc.querySelector('.calc-settings').append(calculatorField('Сейчас, +',start),calculatorField('Цель, +',target),calculatorField('Неудач на текущем уровне',prior));
  const steps=calc.querySelector('.calc-levels');
  const result=calc.querySelector('output');
  const rows=[];
  for(let level=0;level<25;level++){
    const line=gearNode('div',null,'calc-level');
    const title=gearNode('strong','+'+level+' → +'+(level+1));
    const chance=calculatorNumber(temperProtection[level-15]?.[0]??'',0,100);
    chance.placeholder='Шанс из окна закалки';
    const gold=calculatorNumber('',0,1e9);
    gold.placeholder='Цена из окна закалки';
    const catalyst=calculatorSelect([['none','Без расходника'],['standard','Стандартный (+4 п.п.)'],
      ...(level<=12?[['stable','Стабильный (+4 п.п. и защита до +12)']]:[]),
      ...(level>=12&&level<=14?[['power','Мощный (+7 п.п.)']]:[]),['custom','Свой расходник']]);
    const extras=calculatorNumber(0,0,1e9), extraChance=calculatorNumber(0,0,100);
    const protect=gearNode('input');
    protect.type='checkbox';
    const custom=calculatorField('Прибавка к шансу, п.п.',extraChance);
    const guard=calculatorField('Защита от отката',protect);
    const price=calculatorField('Цена расходника в золоте',extras);
    line.append(title,calculatorField('Базовый шанс, %',chance),calculatorField('Золото за попытку',gold),
      calculatorField('Катализатор',catalyst),price,custom,guard);
    steps.append(line);
    rows.push({line,chance,gold,catalyst,extras,extraChance,protect,custom,guard,price});
  }

  function update(){
    const from=start.valueAsNumber, to=target.valueAsNumber;
    prior.disabled=!(from>=15);
    if(![start,target,prior].every(input=>input.disabled||input.checkValidity())||!Number.isInteger(from)||!Number.isInteger(to)||from>=to){
      result.textContent='Выбери начальный уровень и цель выше него.';
      return;
    }
    const values=rows.map((row,level)=>{
      const use=row.catalyst.value;
      row.custom.hidden=use!=='custom';
      row.guard.hidden=use!=='custom'||level<11||level>14;
      row.price.hidden=use==='none';
      return {
        chance:Number(row.chance.value),bonus:{none:0,standard:4,stable:4,power:7,custom:Number(row.extraChance.value)}[use],
        rollback:level>=11&&level<=14&&use!=='stable'&&!(use==='custom'&&row.protect.checked),
        gold:Number(row.gold.value),extra:use==='none'?0:Number(row.extras.value)
      };
    });
    let visibleFrom=from;
    while(visibleFrom>0&&values[visibleFrom].rollback)visibleFrom--;
    rows.forEach((row,level)=>{row.line.hidden=level<visibleFrom||level>=to;});
    const invalid=rows.findIndex((row,level)=>level>=visibleFrom&&level<to&&
      [row.chance,row.gold,row.extras,row.extraChance].some(input=>!input.closest('label').hidden&&!input.checkValidity()));
    if(invalid>=0){
      result.textContent='Проверь введённые значения для перехода с +'+invalid+'.';
      return;
    }
    const forecast=temperForecast(from,to,values,prior.disabled?0:Number(prior.value));
    if(forecast.missing!==undefined){
      result.textContent='Укажи ненулевой шанс перехода с +'+forecast.missing+'.';
      return;
    }
    const count=forecast.count;
    const attempts=count.reduce((sum,n)=>sum+n,0);
    const gold=count.reduce((sum,n,level)=>sum+n*(values[level].gold+values[level].extra),0);
    const catalysts=count.reduce((sum,n,level)=>sum+(rows[level].catalyst.value==='none'?0:n),0);
    const incomplete=count.some((n,level)=>n>0&&rows[level].gold.value==='');
    result.textContent='В среднем '+ruNumber.format(attempts)+' попыток'+(catalysts?' · '+ruNumber.format(catalysts)+' катализаторов':'')+
      (incomplete?' · Заполни цены всех попыток для полного бюджета':' · '+ruNumber.format(gold)+' золота');
  }
  calc.addEventListener('input',update);
  update();
}

const statSlots=['Оружие','Шлем','Нагрудник','Поножи','Перчатки','Обувь','Ожерелье','Наручи','Кольцо','Печать','Талисман','Артефакт'];
const statOrigins=['База персонажа','Закалка','Арретир','Калибровка','Руны','Гравировки','Колода','Питомец','Комплект','Прочее'];

async function mountStatCalculator(view){
  const calc=view.querySelector('#calc-stats');
  const equipment=calc.querySelector('.calc-equipment'), modifiers=calc.querySelector('.calc-modifiers');
  const total=calc.querySelector('.calc-stat-total'), sets=calc.querySelector('.calc-set-total');
  let catalogue;
  try{
    const response=await fetch('data/gearbook.json');
    if(!response.ok)throw new Error();
    catalogue=await response.json();
  }catch{
    equipment.append(gearNode('p','Снаряжение не загрузилось. Дополнительные характеристики можно ввести вручную.'));
  }
  if(!calc.isConnected)return;
  const byName=(a,b)=>a.name.localeCompare(b.name,'ru')||a.level-b.level;
  const items=Object.values(catalogue?.items||{}).sort(byName);
  const selects=[];
  if(catalogue)for(const slot of statSlots){
    if(slot==='Артефакт')continue;
    const choices=items.filter(item=>slot==='Оружие'?!statSlots.includes(item.slot):item.slot===slot);
    const select=calculatorSelect([['','Пусто'],...choices.map(item=>[item.id,item.name+' · '+item.level+' ур.'])]);
    equipment.append(calculatorField(slot,select));
    selects.push(select);
  }

  function addModifier(){
    const row=gearNode('div',null,'calc-modifier');
    const source=calculatorSelect(statOrigins.map(origin=>[origin,origin]));
    const slot=calculatorSelect([['','Общие'],...statSlots.map(slotName=>[slotName,slotName])]);
    const name=gearNode('input');
    name.placeholder='Например, сила заклинаний';
    const value=calculatorNumber('',-1e9,1e9), unit=calculatorSelect([['','ед.'],['%','%']]);
    const remove=gearNode('button','Удалить');
    remove.type='button';
    remove.onclick=()=>{row.remove();update();};
    row.append(calculatorField('Источник',source),calculatorField('Ячейка',slot),calculatorField('Характеристика',name),
      calculatorField('Значение',value),calculatorField('Единица',unit),remove);
    modifiers.append(row);
    return {row,name,value,unit};
  }

  const custom=[addModifier()];
  function update(){
    const equipped=selects.map(select=>catalogue.items[select.value]).filter(Boolean);
    const stats=new Map();
    const totals=raw=>{
      for(const text of raw){
        const parsed=text.match(/^(.+?)\s+([+−-]\s*\d+(?:[.,]\d+)?)\s*(%)?$/u);
        if(parsed)addStat(parsed[1],Number(parsed[2].replace('−','-').replace(',','.').replaceAll(' ','')),parsed[3]||'');
      }
    };
    function addStat(name,value,unit){
      if(!name.trim()||!Number.isFinite(value))return;
      const label=name.trim().replace(/[\s]+/g,' ');
      const key=label.toLocaleLowerCase('ru')+unit;
      if(!stats.has(key))stats.set(key,{label,value:0,unit});
      stats.get(key).value+=value;
    }
    equipped.forEach(item=>totals(item.stats));
    custom.filter(entry=>entry.row.isConnected).forEach(entry=>addStat(entry.name.value,entry.value.valueAsNumber,entry.unit.value));
    const ids=new Set(equipped.map(item=>item.id));
    sets.replaceChildren();
    for(const set of catalogue?.sets||[]){
      const count=set.parts.flat(Infinity).filter(part=>ids.has(typeof part==='object'?part?.id:part)).length;
      for(const bonus of set.bonuses.filter(bonus=>count>=bonus.count)){
        const row=gearNode('li',set.name+' · '+bonus.count+' шт.');
        if(bonus.stats.length)row.append(gearNode('small',bonus.stats.join(' · ')));
        sets.append(row);
      }
    }
    calc.querySelector('.calc-sets').hidden=!sets.children.length;
    total.replaceChildren();
    for(const {label,value,unit} of [...stats.values()].sort((a,b)=>a.label.localeCompare(b.label,'ru'))){
      const row=gearNode('div');
      row.append(gearNode('dt',label),gearNode('dd',ruNumber.format(value)+unit));
      total.append(row);
    }
    if(!stats.size)total.append(gearNode('div','Выбери снаряжение или добавь характеристики.'));
  }
  const add=calc.querySelector('.calc-add');
  add.onclick=()=>{const entry=addModifier();custom.push(entry);entry.name.focus();};
  calc.addEventListener('input',update);
  update();
}

function mountWikiCalculators(view){
  mountTemperCalculator(view);
  mountStatCalculator(view);
}
