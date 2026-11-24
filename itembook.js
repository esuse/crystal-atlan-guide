'use strict';

const itemCategories={
  weapon:'Оружие',armor:'Доспехи',jewelry:'Украшения',artifact:'Артефакты',
  avatar:'Аватары',frame:'Рамки профиля',outfit:'Костюмы',title:'Титулы',transport:'Транспорт',
  material:'Материалы',currency:'Валюты',consumable:'Расходники',potion:'Еда и зелья',
  rune:'Руны',engraving:'Гравировки',recipe:'Рецепты',pet:'Предметы питомцев',emote:'Эмоции',sticker:'Стикеры',record:'Музыкальные пластинки',
  pack:'Сундуки и наборы',stone:'Камни',circuit:'Модули',
  collection:'Коллекция',book:'Книги и записки',other:'Прочие'
};
const itemShortlists={
  itemupgrade:{
    title:'Предметы для прокачки',
    lead:'Экипировка, руны, гравировки и материалы, которые нужны при её улучшении.',
    includes:row=>['weapon','armor','jewelry','rune','engraving','circuit','artifact'].includes(row[2])||
      ['Закалка снаряжения','Купон напыления','Калибровка','Изготовление снаряжения','Чертеж снаряжения','Молитва','Изоморфные руны','Лавка рун'].includes(row[5])
  },
  itemlooks:{
    title:'Коллекция и облики',
    lead:'Аватары, рамки, костюмы и другие предметы для оформления и коллекций.',
    includes:row=>['avatar','frame','outfit','title','transport','collection','emote','sticker','record'].includes(row[2])
  }
};
let itemBookRequest;
const compactItemBook=matchMedia('(max-width:720px)');

function itemBookImage(path,size,alt=''){
  const image=gearNode('img');
  image.src='img/'+path;
  image.alt=alt;
  image.width=size;
  image.height=size;
  image.loading='lazy';
  image.decoding='async';
  return image;
}

function itemBookDescription(description,rewards){
  if(!rewards?.length)return gearEffect(description);
  const paragraph=gearEffect();
  const matches=rewards.map(([label,id])=>({label,id,start:description.lastIndexOf(label)}))
    .filter(match=>match.start>=0).sort((a,b)=>a.start-b.start||b.label.length-a.label.length);
  let cursor=0;
  for(const {label,id,start} of matches){
    if(start<cursor)continue;
    const link=skillBookLink(label,'#itembook/'+id);
    link.className='item-reward-link';
    paragraph.append(description.slice(cursor,start),link);
    cursor=start+label.length;
  }
  paragraph.append(description.slice(cursor));
  return paragraph;
}

function itemBookTrade(offers){
  const section=gearNode('section',null,'item-trade');
  const list=gearNode('ul');
  for(const [shop,href,price,quantity,limit] of offers){
    const row=gearNode('li');
    row.append(gearNode('strong',price+(quantity>1?' за '+quantity+' шт.':'')),skillBookLink(shop,href));
    if(limit)row.append(gearNode('small',limit));
    list.append(row);
  }
  section.append(gearNode('h3','Где купить или обменять'),list);
  return section;
}

function itemBookWays(source,details,packs){
  const result=gearNode('div',null,'item-acquisition');
  if(details?.ways.length){
    const section=gearNode('section',null,'item-trade');
    const list=gearNode('ul');
    for(const [kind,text,href] of details.ways){
      const row=gearNode('li');
      row.append(gearNode('strong',kind));
      row.append(href?skillBookLink(text,href):gearNode('span',text));
      list.append(row);
    }
    section.append(gearNode('h3','Способы получения'),list);
    result.append(section);
  }else if(source){
    const where=gearEffect('Где взять: '+source[0]);
    if(source[1])where.append(' ',skillBookLink('Подробнее',source[1]));
    result.append(where);
  }
  if(details?.recipes.length){
    const section=gearNode('section',null,'item-trade item-recipe');
    section.append(gearNode('h3','Рецепт изготовления'));
    const amounts=new Intl.NumberFormat('ru');
    for(const [gold,ingredients] of details.recipes){
      const list=gearNode('ul');
      for(const [id,label,quantity] of ingredients){
        const row=gearNode('li');
        const text=label+' ×'+amounts.format(quantity);
        row.append(id?skillBookLink(text,'#itembook/'+id):gearNode('span',text));
        list.append(row);
      }
      list.append(gearNode('li',amounts.format(gold)+' золота'));
      section.append(list);
    }
    result.append(section);
  }
  if(packs?.length){
    const section=gearNode('section',null,'item-trade');
    const list=gearNode('ul');
    for(const [id,title] of packs){
      const row=gearNode('li');
      row.append(skillBookLink(title,'#itembook/'+id));
      list.append(row);
    }
    section.append(gearNode('h3','Наборы с этим предметом'),list);
    result.append(section);
  }
  return result;
}

function itemBookCard([id,name,type,description,icon,tags,destination,portraits,source,rewards,offers,details],classNames,packs){
  const card=gearNode('details',null,'nx-choice item-book-card');
  card.id='item-'+id;
  const summary=gearNode('summary');
  const title=gearNode('span',null,'item-book-title');
  title.append(gearNode('span',name,'item-book-name'),gearNode('small',tags||itemCategories[type]));
  if(source)title.append(gearNode('small','Где взять: '+source[0],'item-book-source'));
  else if(offers?.length)title.append(gearNode('small','Обмен: '+offers[0][2],'item-book-source'));
  summary.append(itemBookImage(portraits?.[0][0]||icon,44),title);
  const body=gearNode('div',null,'nx-choice-body');
  if(description)body.append(itemBookDescription(description,rewards));
  if(offers?.length)body.append(itemBookTrade(offers));
  if(portraits){
    const gallery=gearNode('div',null,'item-book-portraits');
    for(const [path,classes] of portraits){
      const names=classes.map(key=>classNames.get(key)).filter(Boolean);
      const figure=gearNode('figure');
      const caption=names[0]||name;
      const portrait=itemBookImage(path,64,caption);
      if(names.length)figure.title=names.join(', ');
      figure.append(portrait,gearNode('figcaption',caption));
      gallery.append(figure);
    }
    const inventory=gearNode('p',null,'item-book-inventory');
    inventory.append(itemBookImage(icon,28),'Иконка в сумке');
    body.append(gearNode('h3','Внешний вид','item-book-preview-title'),gallery,inventory);
  }
  if(source||details||packs?.length)body.append(itemBookWays(source,details,packs));
  if(destination)body.append(skillBookLink('Открыть в снаряжении',destination));
  const link=skillBookLink('Ссылка на предмет','#itembook/'+id);
  link.className='item-book-permalink';
  body.append(link);
  card.append(summary,body);
  return card;
}

function mountItemBook(view,catalog,page){
  const shortlist=itemShortlists[page];
  if(shortlist){
    view.querySelector('h1').textContent=shortlist.title;
    const intro=view.querySelector('#item-book-intro');
    intro.hidden=false;
    intro.textContent=shortlist.lead;
  }
  const results=view.querySelector('.item-book-main');
  const query=view.querySelector('#item-book-search');
  const category=view.querySelector('#item-book-category');
  const picker=view.querySelector('#item-book-select');
  const list=view.querySelector('#item-book-list');
  const status=view.querySelector('#item-book-status');
  const more=view.querySelector('#item-book-more');
  const target=page==='itembook'?location.hash.split('/')[1]:null;
  const classes=new Map();
  for(const group of catalog){
    classes.set(group.id,group.name);
    for(const step of group.steps){
      if(step.anchor)classes.set(step.anchor.replaceAll('-',''),step.className);
    }
  }
  if(!itemBookRequest){
    itemBookRequest=fetch('data/items.json').then(response=>{
      if(!response.ok)throw new Error(String(response.status));
      return response.json();
    }).catch(error=>{itemBookRequest=null;throw error;});
  }
  itemBookRequest.then(data=>{
    const rows=shortlist?data.filter(shortlist.includes):data.slice();
    if(!list.isConnected)return;
    const groups=new Map();
    const collator=new Intl.Collator('ru',{numeric:true});
    rows.sort((a,b)=>collator.compare(a[1],b[1])||a[0]-b[0]);
    for(const row of rows){
      if(!groups.has(row[2]))groups.set(row[2],[]);
      groups.get(row[2]).push(row);
    }
    const available=Object.keys(itemCategories).filter(id=>groups.has(id));
    const selected=rows.find(row=>String(row[0])===target);
    if(target&&!selected)view.querySelector('#item-book-notice').hidden=false;
    const searchNames=new Map(rows.map(row=>[row,skillBookFilter(row[1]+' '+row[5])]));
    const rewardPacks=new Map();
    for(const row of data){
      for(const [,reward] of row[9]||[]){
        if(!rewardPacks.has(reward))rewardPacks.set(reward,[]);
        const packs=rewardPacks.get(reward);
        if(!packs.some(([id])=>id===row[0]))packs.push([row[0],row[1]]);
      }
    }
    let active=selected?.[2]||'';
    let found=[];
    let rendered=0;
    let grid;
    const controls=new Map();
    function choose(id,focus=false){
      active=id;
      picker.value=id;
      for(const [key,button] of controls)button.setAttribute('aria-pressed',String(id===key));
      render();
      if(!compactItemBook.matches&&results.getBoundingClientRect().top<document.querySelector('.masthead').getBoundingClientRect().bottom){
        results.scrollIntoView({block:'start'});
      }
      if(focus)controls.get(id).focus({preventScroll:true});
    }
    for(const id of ['',...available]){
      const label=id?itemCategories[id]:'Все категории';
      const count=id?groups.get(id).length:rows.length;
      const option=gearNode('option',label+' ('+count+')');
      option.value=id;
      picker.append(option);
      const button=gearNode('button',null,'item-book-chip');
      button.type='button';
      button.append(gearNode('span',label),gearNode('span',String(count),'item-book-count'));
      button.setAttribute('aria-pressed',String(id===active));
      button.addEventListener('click',()=>choose(id));
      controls.set(id,button);
      category.append(button);
    }
    function appendMore(){
      const pageSize=compactItemBook.matches?18:36;
      for(const row of found.slice(rendered,rendered+pageSize))grid.append(itemBookCard(row,classes,rewardPacks.get(row[0])));
      rendered=Math.min(rendered+pageSize,found.length);
      status.textContent=found.length?'Показано '+rendered+' из '+found.length:'По запросу ничего не найдено.';
      more.hidden=rendered>=found.length;
    }
    function addGroup(id,items){
      const section=gearNode('section',null,'item-book-group');
      const header=gearNode('div',null,'item-book-group-head');
      const heading=gearNode('h2',itemCategories[id]);
      heading.append(gearNode('span',String(items.length),'item-book-count'));
      header.append(heading);
      if(!active&&items.length>4){
        const button=gearNode('button','Смотреть все','skill-copy');
        button.type='button';
        button.setAttribute('aria-label','Смотреть все: '+itemCategories[id]);
        button.addEventListener('click',()=>choose(id,true));
        header.append(button);
      }
      grid=gearNode('div',null,'item-book-grid');
      section.append(header,grid);
      list.append(section);
    }
    function render(first=false){
      const words=skillBookFilter(query.value).split(/\s+/).filter(Boolean);
      list.replaceChildren();
      more.hidden=true;
      const matches=row=>words.every(word=>searchNames.get(row).includes(word));
      if(compactItemBook.matches&&!active){
        found=rows.filter(matches);
        rendered=0;
        grid=gearNode('div',null,'item-book-grid');
        list.append(grid);
        appendMore();
        return;
      }
      let total=0;
      for(const id of active?[active]:available){
        const items=groups.get(id).filter(matches);
        if(!items.length)continue;
        total+=items.length;
        addGroup(id,items);
        if(active){
          found=first&&selected?[selected,...items.filter(row=>row!==selected)]:items;
          rendered=0;
          appendMore();
          return;
        }
        for(const row of items.slice(0,4))grid.append(itemBookCard(row,classes,rewardPacks.get(row[0])));
      }
      status.textContent=total?'Предметов: '+total:'По запросу ничего не найдено.';
    }
    picker.value=active;
    picker.addEventListener('change',()=>choose(picker.value));
    query.addEventListener('input',()=>render());
    compactItemBook.onchange=()=>{
      if(list.isConnected)render();
      else compactItemBook.onchange=null;
    };
    more.addEventListener('click',appendMore);
    render(true);
    if(selected){
      const card=document.getElementById('item-'+selected[0]);
      card.open=true;
      card.scrollIntoView({block:'start'});
    }
  }).catch(()=>{if(list.isConnected)status.textContent='Не удалось открыть каталог предметов.';});
}
