const skillBookData=new Map();
const warlockSkillAliases={"s-warlock-reckoning":"2020013","s-warlock-gaping-void":"2020019","s-warlock-blight-mark":"2020020","s-warlock-raven-feast":"2020014","s-warlock-dark-wave":"2020015","s-warlock-gloomy-shadows":"2020023","s-warlock-dark-gate":"2020016","s-warlock-retribution":"2020024","s-warlock-soul-harvest":"2020017","s-warlock-last-path":"2020021","s-warlock-punishing-hand":"2020025","s-warlock-decomposition":"2020022","s-warlock-0":"2020018","s-warlock-1":"2020030","s-warlock-2":"2020026","s-warlock-4":"2020027","s-warlock-3":"2020029","s-warlock-5":"2020028","s-warlock-6":"2020031","s-warlock-7":"2020033","s-warlock-8":"2020032"};

function skillElement(tag, value, css){
  const node=document.createElement(tag);
  if(value!==undefined)node.textContent=value;
  if(css)node.className=css;
  return node;
}

function skillBookLink(text, destination){
  const link=skillElement('a',text);
  link.href=destination;
  return link;
}

function skillBookUrl(slug,id){
  return '#skillbook/'+slug+(id?'/'+id:'');
}

function skillBookGroups(catalog){
  return catalog.map(group=>({
    name:group.name,
    trees:[
      {slug:group.id,name:group.name+' · базовые умения'},
      ...group.steps.map(step=>({slug:step.anchor,name:step.className}))
    ]
  }));
}

function skillBookFilter(s){
  return s.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
}

function skillReference(row, rows, slug){
  const card=skillElement('details',undefined,'nx-choice skill-reference');
  card.id='skill-ref-'+row.id;
  const title=skillElement('summary');
  const heading=skillElement('span',undefined,'class-skill');
  const icon=skillElement('img');
  icon.src='img/skills/'+row.icon;
  icon.alt='';
  icon.loading='lazy';
  icon.width=40;
  icon.height=40;
  const name=skillElement('span',row.ru);
  name.append(skillElement('small',[row.type,row.open?row.open+'-й уровень':''].filter(Boolean).join(' · ')));
  heading.append(icon,name);
  title.append(heading);

  const body=skillElement('div',undefined,'do nx-choice-body');
  if(row.descRu)body.append(skillElement('p',row.descRu,'skill-summary skill-description'));
  if(row.pvpRu){
    const pvp=skillElement('div',undefined,'skill-pvp-description');
    pvp.append(skillElement('strong','PvP'),skillElement('p',row.pvpRu,'skill-description'));
    body.append(pvp);
  }
  const copy=skillElement('button','Скопировать ссылку','skill-copy');
  copy.type='button';
  copy.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(new URL(skillBookUrl(slug,row.id),location.href));
      copy.textContent='Ссылка скопирована';
    }catch{
      location.hash=skillBookUrl(slug,row.id);
    }
  });
  body.append(copy);
  card.append(title,body);
  return card;
}

function mountSkillBook(view, catalog){
  const groups=skillBookGroups(catalog);
  const select=view.querySelector('#skill-book-class');
  const kind=view.querySelector('#skill-book-type');
  const query=view.querySelector('#skill-book-search');
  const status=view.querySelector('#skill-book-status');
  const list=view.querySelector('#skill-book-list');
  const [,requested,target]=location.hash.slice(1).split('/');
  for(const group of groups){
    const options=skillElement('optgroup');
    options.label=group.name;
    for(const tree of group.trees){
      const option=skillElement('option',tree.name);
      option.value=tree.slug;
      options.append(option);
    }
    select.append(options);
  }
  const slug=groups.some(group=>group.trees.some(tree=>tree.slug===requested))?requested:'warlock';
  select.value=slug;
  select.addEventListener('change',()=>{location.hash=skillBookUrl(select.value);});
  status.textContent='Загружаю умения…';

  if(!skillBookData.has(slug)){
    const load=fetch('data/skills/'+slug+'.json').then(response=>{
      if(!response.ok)throw new Error(String(response.status));
      return response.json();
    }).catch(error=>{skillBookData.delete(slug);throw error;});
    skillBookData.set(slug,load);
  }
  skillBookData.get(slug).then(rows=>{
    if(!list.isConnected)return;
    const cards=rows.map(row=>{
      const words=skillBookFilter([row.ru,row.type].filter(Boolean).join(' '));
      return {row,words,element:skillReference(row,rows,slug)};
    });
    list.append(...cards.map(card=>card.element));
    function filter(){
      const words=skillBookFilter(query.value).split(/\s+/).filter(Boolean);
      let visible=0;
      for(const card of cards){
        const show=(!kind.value||card.row.type===kind.value)&&words.every(word=>card.words.includes(word));
        card.element.hidden=!show;
        visible+=Number(show);
      }
      status.textContent=visible?'Показано '+visible+' из '+rows.length:'По этому запросу умения не найдены.';
    }
    query.addEventListener('input',filter);
    kind.addEventListener('change',filter);
    filter();
    if(target){
      const match=cards.find(card=>card.row.id===target);
      if(match){
        match.element.open=true;
        match.element.scrollIntoView({block:'start'});
      }
    }
  }).catch(()=>{
    if(list.isConnected)status.textContent='Не удалось загрузить умения. Обнови страницу или выбери другой класс.';
  });
}
