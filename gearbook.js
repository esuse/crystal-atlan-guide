'use strict';

const gearClassCodes={
  magiblade:101,berserker:102,karmaslayer:103,
  elementalist:201,warlock:202,magician:203,
  'bounty-hunter':301,gunner:302,mystrix:303,
  scytheguard:401,blademaiden:402,glaciette:403,
  cloudstrider:501,starbreaker:502,sugariff:503,
  empirica:601,rhapsodia:602,specter:701,mirage:702
};
const gearClassSetNotes={
  101:{56227:'Быстрые серии ударов помогают набрать комбо для «Оплота веры».',56229:'Дополнительные рывки пригодятся, если часто меняешь позицию.'},
  102:{56226:'Если играешь на низком здоровье, следи за расходом здоровья от «Искупления». Вечный нагрудник отключает расход.'},
  103:{56225:'Если часто применяешь обычные умения во время боя с демоном, они дают попытки призыва жрицы.'},
  201:{56225:'Если за счёт сокращения откатов часто применяешь обычные умения, они дают попытки призыва жрицы.'},
  202:{56227:'Подходит Чернокнижнику, если атаки и умения набирают больше 100 комбо на боссе. Вечные поножи добавляют 3 к счётчику за атаку.',56233:'Если существенная часть урона идёт от сверхспособности, сначала накопи обеты отмеченными умениями.'},
  203:{56225:'Частое применение обычных умений даёт попытки призыва жрицы между твоими атаками.'},
  301:{56227:'Если парные пистолеты держат длинное комбо, сможешь использовать «Оплот веры».',56229:'Дополнительные рывки помогают держать дистанцию.'},
  302:{56229:'Лишние рывки помогут выйти из атаки босса и вернуться на удобную дистанцию.'},
  303:{56225:'Если часто используешь обычные умения между сменами формы оружия, они дают попытки призыва жрицы.'},
  401:{56234:'Если играешь Фальчериной как поддержкой отряда, добавь лечение и защиту через нужные ячейки умений.'},
  402:{56227:'Если совместные удары с марионеткой держат счётчик комбо, появится возможность использовать «Оплот веры».'},
  403:{56225:'Обычные умения могут дополнительно призвать жрицу, пока марионетка атакует врагов.'},
  501:{56225:'Обычные умения, которые ты чередуешь с базовой атакой, дают попытки призыва жрицы.'},
  502:{56229:'Дополнительные рывки пригодятся, чтобы найти позицию для тяжёлых заряжаемых ударов.'},
  503:{56225:'Если часто применяешь обычные умения в ритме, они дают попытки призыва жрицы.'},
  601:{56227:'Рассмотри комплект, если попадания в твоей ротации с турелями удерживают счётчик комбо выше 100.'},
  602:{56225:'Частые обычные умения при смене форм дают попытки призыва жрицы.'},
  701:{56227:'Быстрые серии попаданий после рывка помогают набирать комбо.',56229:'Дополнительные рывки дают больше свободы для входа в серию и выхода из опасной зоны.'},
  702:{56225:'Повторное применение обычного умения даёт ещё одну попытку призыва жрицы, когда её эффект готов.'}
};
let gearBookRequest;

function gearNode(tag,text,css){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  if(css)node.className=css;
  return node;
}

function gearEffect(text){
  return gearNode('p',text,'skill-description gear-effect');
}

const gearJewelryNotes={
  56230:'Для затяжного боя: набирай силы духов и усиливай урон за счёт их накопления.',
  56231:'Для сборки, в которой часто активируешь резонанс и бьёшь после него.',
  56232:'Если пользуешься едой и зельями в бою ради защиты и урона.',
  56233:'Если значимая часть урона приходится на сверхспособность.',
  56234:'Для поддержки отряда: эффекты зависят от ячейки обычного умения.'
};
const gearWeaponNotes={
  5369:'Если хочешь усилить классовую сверхспособность. Этот Абсолют можно улучшить до 80-го уровня.',
  5370:'Если регулярно используешь оба яруса умений и можешь поддерживать накопленные бонусы.',
  5371:'Если часто включаешь резонанс или сверхспособность, чтобы одновременно получить все три усиления.',
  5372:'Если строишь бой вокруг классовой сверхспособности и хочешь поднять предел уровня многокомпонентных рун.',
  5373:'Если регулярно используешь оба яруса умений на длинном боссе.',
  5374:'Если регулярно активируешь резонанс или сверхспособность для общего окна усиления.'
};

function gearItem(item,family,recommendation){
  const card=gearNode('details',null,'nx-choice gear-item');
  card.id='gear-'+item.id;
  const summary=gearNode('summary');
  const iconFrame=gearNode('span',null,'gear-icon-frame');
  iconFrame.setAttribute('aria-hidden','true');
  if(item.icon){
    const icon=gearNode('img',null,'gear-icon');
    icon.src='img/gear/'+item.icon+'.webp';
    icon.alt='';
    icon.width=36;
    icon.height=36;
    icon.loading='lazy';
    icon.decoding='async';
    iconFrame.append(icon);
  }
  const title=gearNode('span',null,'gear-item-title');
  title.append(gearNode('span',item.name),
    gearNode('small',[item.level+'-й уровень',family].filter(Boolean).join(' · '),'gear-meta'));
  summary.append(iconFrame,title);
  const body=gearNode('div',null,'nx-choice-body gear-body');
  if(recommendation)body.append(gearEffect(recommendation));
  if(item.plain)body.append(gearEffect(item.plain));
  if(item.stats.length)body.append(gearEffect(item.stats.join(' · ')));
  const details=gearNode('details',null,'gear-bonus-detail');
  const skill=item.skill;
  const titleInEffect=skill&&'«'+skill.name+'»';
  for(const text of item.effects){
    const position=titleInEffect?text.indexOf(titleInEffect):-1;
    if(position<0){
      details.append(gearEffect(text));
      continue;
    }
    const paragraph=gearEffect();
    paragraph.append(text.slice(0,position+1),
      skillBookLink(skill.name,skillBookUrl(skill.slug,skill.id)),
      text.slice(position+titleInEffect.length-1));
    body.append(paragraph);
  }
  if(details.childElementCount){
    details.prepend(gearNode('summary','Подробные эффекты'));
    body.append(details);
  }
  card.append(summary,body);
  return card;
}

const pilgrimSetId=56235;
const gearKinds={
  armor:'Доспехи',
  jewelry:'Украшения',
  all:'Доспехи и украшения'
};

function gearSet(data,family,classNote){
  const card=gearNode('details',null,'nx-choice gear-set gear-set-overview');
  card.id='gear-'+family.id;
  const summary=gearNode('summary');
  const heading=gearNode('span',null,'gear-set-heading');
  const title=gearNode('span',family.name,'gear-set-name');
  const tags=gearNode('span',null,'gear-set-tags');
  tags.append(gearNode('span',gearKinds[family.kind],'gear-set-category'),
    gearNode('span','Эпическое','gear-set-badge gear-rarity-epic'));
  const eternalItems=family.parts.flatMap(variants=>variants.slice(2));
  if(eternalItems.length)tags.append(gearNode('span','Есть вечное','gear-set-badge gear-rarity-eternal'));
  if(family.id===pilgrimSetId)tags.append(gearNode('span','Стартовый комплект','gear-set-badge'));
  if(classNote)tags.append(gearNode('span','Рекомендация для класса','gear-set-badge gear-class-recommendation'));
  heading.append(title,tags);

  const icons=gearNode('span',null,'gear-set-icons');
  icons.setAttribute('aria-hidden','true');
  for(const id of [...family.parts.map(variants=>variants[1]),...eternalItems]){
    const item=data.items[id];
    if(!item.icon)continue;
    const eternal=eternalItems.includes(id);
    const icon=gearNode('img',null,eternal?'gear-set-preview gear-set-preview-eternal':'gear-set-preview');
    icon.src='img/gear/'+item.icon+'.webp';
    icon.alt='';
    icon.title=item.name+(eternal?' (Вечное)':'');
    icon.width=38;
    icon.height=38;
    icon.loading='lazy';
    icons.append(icon);
  }
  const overview=gearNode('span',null,'gear-set-notes');
  const notes=[['Кому подходит',family.profile],['Как работает',family.highlight]];
  if(classNote)notes.push(['Почему подходит',classNote]);
  for(const [label,text] of notes){
    const note=gearNode('span',null,'gear-set-note');
    note.append(gearNode('span',label,'gear-note-label'),gearNode('span',text));
    overview.append(note);
  }
  const farm=gearNode('span',null,'gear-farm');
  const description=family.id===pilgrimSetId
    ?'Сундуки за 75-й и 80-й уровни.'
    :'75-й уровень - Обитель распада III. Эпик 80-го уровня - улучшение вещи 75-го. Вечное 80-го уровня - Обитель распада III и Молитва вечности.';
  farm.append(gearNode('span','Где брать: ','gear-farm-mark'),description);
  summary.append(heading,icons,farm,overview);

  const body=gearNode('div',null,'nx-choice-body gear-body');
  const farmLinks=gearNode('p',null,'gear-farm');
  farmLinks.append(skillBookLink('Где брать снаряжение','#gear/b-where'));
  if(family.id!==pilgrimSetId){
    farmLinks.append(' · ',skillBookLink('Молитва вечности','#prayer/b-pr_eternal'),' · ',
      skillBookLink('Материалы из Литургии стужи','#liturgy'));
  }
  body.append(farmLinks,gearNode('h2','Бонусы комплекта','gear-set-subhead'));
  const bonuses=gearNode('dl',null,'gear-bonuses');
  for(const bonus of family.bonuses){
    const tier=gearNode('div',null,'gear-bonus');
    const count=family.kind==='all'?'2, 4, 6, 8 и 10 вещей':bonus.count+' '+(bonus.count===5?'вещей':'вещи');
    const entry=gearNode('dd');
    entry.append(gearEffect(bonus.summary));
    const detail=gearNode('details',null,'gear-bonus-detail');
    detail.append(gearNode('summary','Полное описание'));
    if(bonus.stats.length)detail.append(gearEffect(bonus.stats.join(' · ')));
    for(const description of bonus.effects)detail.append(gearEffect(description));
    entry.append(detail);
    tier.append(gearNode('dt',count),entry);
    bonuses.append(tier);
  }
  body.append(bonuses,gearNode('h2','Предметы комплекта','gear-set-subhead'));
  const rows=gearNode('div',null,'gear-parts');
  for(const variants of family.parts){
    const row=gearNode('div',null,'gear-slot');
    row.append(gearNode('h3',data.items[variants[0]].slot,'gear-slot-name'));
    for(const id of variants){
      const item=data.items[id];
      const rarity=variants.length===3&&id===variants[2]?'Вечное':'Эпическое';
      row.append(gearItem(item,rarity));
    }
    rows.append(row);
  }
  body.append(rows);
  card.append(summary,body);
  return card;
}

function gearPaths(view,data,code){
  const queue=data.prerequisites.filter(id=>data.items[id].class===code);
  const [grandmaster,absolut]=queue.map(id=>data.items[id]);
  const article=view.querySelector('#gear-book-path').content.cloneNode(true);
  article.querySelector('[data-grandmaster]').textContent=grandmaster.name;
  article.querySelector('[data-absolut]').textContent=absolut.name;
  const steps=article.querySelector('[data-weapons-path]');
  const upgrades=data.weapons.filter(id=>data.items[id].class===code&&(
    (id>=536900&&id<537000)||(id>=537211&&id<=537272)
  ));
  for(const id of [...queue,...upgrades])steps.append(gearItem(data.items[id]));
  return article;
}

function mountGearBook(view,catalog){
  const panel=view.querySelector('#gear-book-list');
  const status=view.querySelector('#gear-book-status');
  const kind=view.querySelector('#gear-book-kind');
  const level=view.querySelector('#gear-book-level');
  const picker=view.querySelector('#gear-book-class');
  const classSkills=view.querySelector('#gear-book-class-skills');
  const query=view.querySelector('#gear-book-search');
  const [,requestedSection,target]=location.hash.slice(1).split('/');
  const section=['weapons','craft','extra'].includes(requestedSection)?requestedSection:'sets';
  for(const link of view.querySelectorAll('[data-gear-section]')){
    const name=link.dataset.gearSection;
    if(name===section)link.setAttribute('aria-current','page');
  }
  for(const group of catalog){
    const choices=gearNode('optgroup');
    choices.label=group.name;
    for(const skill of group.steps){
      const option=gearNode('option',skill.className);
      option.value=gearClassCodes[skill.anchor];
      option.dataset.anchor=skill.anchor;
      choices.append(option);
    }
    picker.append(choices);
  }
  const selectedClass=localStorage.getItem('wiki-gear-class')??sessionStorage.getItem('wiki-gear-class');
  picker.value=Array.from(picker.options).some(o=>o.value===selectedClass)?selectedClass:'';
  function updateClassLink(){
    const anchor=picker.selectedOptions[0]?.dataset.anchor;
    classSkills.hidden=!anchor;
    if(anchor)classSkills.href='#skillbook/'+anchor;
  }
  picker.addEventListener('change',()=>{
    localStorage.setItem('wiki-gear-class',picker.value);
    updateClassLink();
  });
  updateClassLink();
  view.querySelector('#gear-book-kind-label').hidden=section!=='sets';
  view.querySelector('#gear-book-level-label').hidden=section!=='weapons';
  view.querySelector('#gear-book-search-label').hidden=section==='craft';
  if(section==='sets')query.placeholder='По названию предмета или эффекту';
  if(!gearBookRequest){
    gearBookRequest=fetch('data/gearbook.json').then(response=>{
      if(!response.ok)throw new Error(String(response.status));
      return response.json();
    }).catch(error=>{gearBookRequest=null;throw error;});
  }
  gearBookRequest.then(data=>{
    if(!panel.isConnected)return;
    if(target&&['weapons','craft'].includes(section)&&data.items[target]?.class){
      picker.value=String(data.items[target].class);
      updateClassLink();
    }
    function render(){
      const needle=skillBookFilter(query.value);
      const code=Number(picker.value);
      const classNotes=gearClassSetNotes[code]??{};
      panel.replaceChildren();
      if(!code&&(section==='weapons'||section==='craft')){
        status.textContent='Выбери специализацию, чтобы увидеть подходящее оружие.';
        return;
      }
      if(section==='craft'){
        panel.append(gearPaths(view,data,code));
        status.textContent='';
        return;
      }
      let entries;
      if(section==='weapons'){
        entries=data.weapons.filter(id=>data.items[id].class===code).map(id=>data.items[id])
          .filter(item=>(!level.value||Number(level.value)===item.level)&&skillBookFilter(item.name).includes(needle))
          .map(item=>{
            const advice=gearWeaponNotes[Math.floor(item.id/100)];
            return gearItem(item,null,advice?'Рекомендация: '+advice:null);
          });
      }else if(section==='extra'){
        entries=data.extra.filter(series=>skillBookFilter(series.name+' '+series.items.map(id=>data.items[id].name).join(' ')).includes(needle)).map(series=>{
          const card=gearNode('details',null,'nx-choice gear-set');
          card.append(gearNode('summary',series.name));
          const body=gearNode('div',null,'nx-choice-body gear-body');
          if(series.profile)body.append(gearNode('p',series.profile,'gear-profile'));
          for(const id of series.items)body.append(gearItem(data.items[id],'Эпическое'));
          card.append(body);
          return card;
        });
      }else{
        entries=data.sets.filter(family=>(!kind.value||kind.value===family.kind)&&
          skillBookFilter([family.name,family.profile,family.highlight,
            ...family.bonuses.map(bonus=>bonus.summary),
            ...family.parts.flat().map(id=>data.items[id].name)].join(' ')).includes(needle))
          .sort((a,b)=>Number(b.id===pilgrimSetId)-Number(a.id===pilgrimSetId)||
            Number(Boolean(classNotes[b.id]))-Number(Boolean(classNotes[a.id])))
          .map(family=>gearSet(data,family,classNotes[family.id]||(code?gearJewelryNotes[family.id]:null)));
      }
      panel.append(...entries);
      status.textContent=entries.length?'':'По запросу ничего не найдено';
    }
    kind.addEventListener('change',render);
    level.addEventListener('change',render);
    picker.addEventListener('change',render);
    query.addEventListener('input',render);
    render();
    if(target){
      const found=document.getElementById('gear-'+target);
      if(found&&panel.contains(found)){
        for(let card=found;card&&panel.contains(card);card=card.parentElement.closest('details'))card.open=true;
        found.scrollIntoView({block:'start'});
      }
    }
  }).catch(()=>{status.textContent='Не удалось загрузить снаряжение. Обнови страницу.';});
}
