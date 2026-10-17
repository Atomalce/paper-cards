'use strict';
(() => {
  const C = window.PaperCardsCore, KEY = 'paper-cards.v1', $ = id => document.getElementById(id);
  let cards = [], mode = 'all', activeId = null, flipped = false, editingId = null;
  const notify = message => { $('notice').textContent = message; $('notice').hidden = !message; };
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cards)); return true; } catch { notify('当前卡片未能保存到浏览器。请立即导出备份，并检查存储空间或隐私设置。'); return false; } };
  try { const text = localStorage.getItem(KEY); if (text) cards = C.validateCards(JSON.parse(text)); } catch { notify('原有保存记录无法读取。当前使用空白卡组；后续保存会替换原记录。'); }
  const visible = () => C.filterCards(cards, mode, $('search').value);
  function render() {
    const list = visible();
    if (!list.some(c => c.id === activeId)) { activeId = list[0]?.id || null; flipped = false; }
    const current = list.find(c => c.id === activeId), index = list.findIndex(c => c.id === activeId);
    $('position').textContent = current ? `${index+1} / ${list.length}` : '0 / 0';
    $('face-label').textContent = flipped ? 'ANSWER' : 'QUESTION';
    $('face-text').textContent = current ? (flipped ? current.answer : current.question) : cards.length ? '当前筛选没有匹配的卡片。' : '从一个好问题开始。';
    $('hint').textContent = current ? flipped ? '想起了多少？给这张卡片一个诚实的标记。' : '先试着回答，再点击这里翻面。' : '写一张新卡片，或者切换筛选条件。';
    $('flashcard').disabled = !current;
    $('flashcard').setAttribute('aria-label', current ? (flipped ? '返回问题' : '显示答案') : '暂无卡片');
    $('remember').disabled = $('again').disabled = !current || !flipped;
    $('prev').disabled = $('next').disabled = list.length < 2;
    $('known-count').textContent = cards.filter(c => c.known).length;
    $('total-count').textContent = cards.length;
    $('progress').value = cards.filter(c => c.known).length; $('progress').max = Math.max(1,cards.length);
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === mode)));
    $('cards-list').replaceChildren();
    list.forEach(card => {
      const li = document.createElement('li'), dot = document.createElement('span'), question = document.createElement('button'), edit = document.createElement('button'), del = document.createElement('button');
      li.className = 'card-row'; dot.className = `status-dot${card.known ? ' known' : ''}`; dot.setAttribute('aria-label', card.known ? '已熟悉' : '待练习');
      question.className = 'question'; question.textContent = card.question; question.addEventListener('click',()=>{activeId=card.id;flipped=false;render();});
      edit.textContent = '编辑'; edit.setAttribute('aria-label',`编辑：${card.question}`); edit.addEventListener('click',()=>{editingId=card.id;$('question').value=card.question;$('answer').value=card.answer;$('form-title').textContent='编辑这张卡片';$('submit').textContent='保存修改';$('cancel').hidden=false;$('question').focus();});
      del.textContent = '删除'; del.setAttribute('aria-label',`删除：${card.question}`); del.addEventListener('click',()=>{if(!confirm('删除这张卡片？建议先导出备份。'))return;cards=cards.filter(c=>c.id!==card.id);if(editingId===card.id)resetForm();save();render();});
      li.append(dot,question,edit,del); $('cards-list').append(li);
    });
    $('empty-list').hidden = list.length > 0; $('empty-list').textContent = cards.length ? '没有符合条件的卡片。' : '这里还没有卡片。';
  }
  function resetForm(){ editingId=null; $('card-form').reset(); $('form-title').textContent='写一张新卡片';$('submit').textContent='保存卡片';$('cancel').hidden=true; }
  function move(delta){const list=visible(), index=list.findIndex(c=>c.id===activeId);if(!list.length)return;activeId=list[(index+delta+list.length)%list.length].id;flipped=false;render();}
  $('flashcard').addEventListener('click',()=>{flipped=!flipped;render();});
  $('prev').addEventListener('click',()=>move(-1)); $('next').addEventListener('click',()=>move(1));
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.filter;activeId=null;flipped=false;render();}));
  $('search').addEventListener('input',()=>{activeId=null;flipped=false;render();});
  function mark(known){const card=cards.find(c=>c.id===activeId);if(!card||!flipped)return;card.known=known;const stored=save();render();if(stored)notify(known?'已标记为熟悉。仍然可以在“全部”中回顾。':'已保留为待练习。下次再试试。');}
  $('remember').addEventListener('click',()=>mark(true)); $('again').addEventListener('click',()=>mark(false));
  $('card-form').addEventListener('submit',e=>{
    e.preventDefault(); const old=cards.find(c=>c.id===editingId);
    const card={id:old?.id||uid(),question:$('question').value,answer:$('answer').value,known:old?.known||false};
    try{const next=old?cards.map(c=>c.id===old.id?card:c):[...cards,card];cards=C.validateCards(next);}catch(error){notify(error.message);return;}
    activeId=card.id;mode='all';$('search').value='';flipped=false;const stored=save();resetForm();render();if(stored)notify(old?'卡片已更新。':'新卡片已保存。');
  });
  $('cancel').addEventListener('click',resetForm);
  $('examples').addEventListener('click',()=>{
    if(cards.length && !confirm('示例将替换当前卡组。请先导出备份，是否继续？'))return;
    cards=[
      {id:'example-1',question:'一张好卡片，应该怎样提问？',answer:'围绕一个具体知识点提问，让答案可以被核对。太宽泛的问题可以拆成几张卡片。',known:false},
      {id:'example-2',question:'为什么先回答，再翻面？',answer:'先尝试组织答案，再查看背面，并对照遗漏的关键点。卡片帮助你回顾，答案仍需要自己核实。',known:false},
      {id:'example-3',question:'怎样把卡片带到另一台设备？',answer:'点击“导出备份”保存JSON文件。在另一台设备打开应用，再点击“导入卡片”选择该文件。',known:false}
    ];activeId=null;mode='all';$('search').value='';flipped=false;resetForm();save();render();
  });
  $('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(cards,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='paper-cards-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('import').addEventListener('click',()=>$('file').click());
  $('file').addEventListener('change',async()=>{
    const file=$('file').files[0];$('file').value='';if(!file)return;
    try{
      if(file.size>2*1024*1024)throw new Error('文件不能超过2MB。');
      const text=await file.text();const next=C.validateCards(JSON.parse(text));
      if(cards.length&&!confirm('校验通过。导入将替换现有卡片，是否继续？'))return;
      cards=next;mode='all';activeId=null;flipped=false;$('search').value='';resetForm();const stored=save();render();if(stored)notify(`已导入${cards.length}张卡片。`);
    }catch(error){notify(`导入未完成，原卡片保留。${error.message}`);}
  });
  window.addEventListener('storage',e=>{if(e.key!==KEY||e.newValue===null)return;try{cards=C.validateCards(JSON.parse(e.newValue));flipped=false;resetForm();render();notify('已载入另一个标签页的更新。建议只在一个标签页编辑。');}catch{notify('其他标签页的数据无效，已保留当前卡组。');}});
  render();
})();
