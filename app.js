(function(){
  'use strict';
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

  /* menu mobilne */
  var burger=$('#burger');
  if(burger){
    burger.addEventListener('click',function(){
      var o=document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded',o?'true':'false');
    });
    $$('#nav a').forEach(function(a){a.addEventListener('click',function(){document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false')})});
  }

  /* przesuwane rzędy: palec natywnie, mysz przeciąganiem, strzałki */
  function rail(el,onMove){
    var down=false,sx=0,sl=0,moved=false;
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType!=='mouse'||e.button!==0)return;
      down=true;moved=false;sx=e.clientX;sl=el.scrollLeft;
    });
    window.addEventListener('pointermove',function(e){
      if(!down)return;
      var dx=e.clientX-sx;
      if(!moved&&Math.abs(dx)>5){moved=true;el.classList.add('drag')}
      if(moved){el.scrollLeft=sl-dx;e.preventDefault()}
    });
    window.addEventListener('pointerup',function(){
      if(!down)return;down=false;
      if(moved){
        var w=el.firstElementChild?el.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(el).columnGap||0):el.clientWidth;
        var i=Math.round(el.scrollLeft/w);
        el.classList.remove('drag');
        el.scrollTo({left:i*w,behavior:'smooth'});
        setTimeout(function(){moved=false},50);
      }
    });
    el.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation()}},true);
    el.addEventListener('dragstart',function(e){e.preventDefault()});
    if(onMove)el.addEventListener('scroll',onMove,{passive:true});
  }
  function step(el,dir){
    var c=el.firstElementChild;if(!c)return;
    var w=c.getBoundingClientRect().width+parseFloat(getComputedStyle(el).columnGap||0);
    el.scrollBy({left:dir*w,behavior:'smooth'});
  }
  $$('.arr').forEach(function(box){
    var el=document.getElementById(box.getAttribute('data-for'));if(!el)return;
    var p=$('.prev',box),n=$('.next',box);
    function upd(){p.disabled=el.scrollLeft<4;n.disabled=el.scrollLeft+el.clientWidth>=el.scrollWidth-4}
    p.addEventListener('click',function(){step(el,-1)});
    n.addEventListener('click',function(){step(el,1)});
    rail(el,upd);upd();window.addEventListener('resize',upd);
  });

  /* galeria na karcie wyjazdu */
  var gal=$('#gal');
  if(gal){
    var cnt=$('#galc'),tot=gal.children.length;
    var upd=function(){var i=Math.round(gal.scrollLeft/gal.clientWidth);cnt.textContent=(i+1)+' / '+tot};
    rail(gal,upd);
    $('.gal .ga.p').addEventListener('click',function(){gal.scrollBy({left:-gal.clientWidth,behavior:'smooth'})});
    $('.gal .ga.n').addEventListener('click',function(){gal.scrollBy({left:gal.clientWidth,behavior:'smooth'})});
  }

  /* formularz kontaktowy (pokazowy) */
  var cf=$('#cform');
  if(cf){
    cf.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=true;
      $$('[required]',cf).forEach(function(i){var b=!i.value.trim();i.parentNode.classList.toggle('err',b);if(b)ok=false});
      $('#cmsg').textContent=ok?'Dziękujemy. To formularz pokazowy, w podglądzie nic nie zostało wysłane.':'Uzupełnij imię i telefon.';
    });
  }

  /* dolny pasek na telefonie: dopiero po przewinięciu za przycisk Rezerwuj */
  var mob=$('#mob'),top=window.innerWidth<=760&&$('#rez-m')?$('#rez-m'):$('#rez-top');
  if(mob&&top&&'IntersectionObserver' in window){
    var seenTop=true,past=false;
    new IntersectionObserver(function(en){
      en.forEach(function(x){
        seenTop=x.isIntersecting;
        past=!x.isIntersecting&&x.boundingClientRect.top<0;
      });
      mob.classList.toggle('widac',!seenTop&&past);
    }).observe(top);
    window.addEventListener('scroll',function(){
      mob.classList.toggle('widac',!seenTop&&top.getBoundingClientRect().top<0);
    },{passive:true});
  }

  /* ---------- zapis na wyjazd (pokazowy) ---------- */
  var bk=$('#bk');
  if(!bk)return;
  var CENA=1090,MAX=10,cur=1,ile=1;
  var fmt=function(n){return n.toLocaleString('pl-PL').replace(/ /g,' ')+' zł'};
  var stations=[{x:12.5,y:50},{x:37.5,y:40},{x:62.5,y:28},{x:87.5,y:12}];
  var pathX=[0,37.5,112.5,187.5,262.5],pathY=[54,50,40,28,12];
  var pk=$('#pk'),trDone=$('#tr-done');

  function val(name){var r=$('input[name="'+name+'"]:checked',bk);return r?r.value:''}
  function persons(){
    var a=[($('#f-imie').value+' '+$('#f-nazw').value).trim()||'osoba zgłaszająca'];
    $$('.pers',bk).forEach(function(p,i){var n=($('.pi',p).value+' '+$('.pn',p).value).trim();a.push(n||('uczestnik '+(i+2)))});
    return a;
  }
  function renderPers(){
    var box=$('#pers'),have=$$('.pers',box).length;
    for(var i=have;i<ile-1;i++){
      var d=document.createElement('div');d.className='pers';
      d.innerHTML='<h4>Uczestnik '+(i+2)+'</h4><div class="g2"><label class="fl"><span>Imię</span><input class="pi" required></label><label class="fl"><span>Nazwisko</span><input class="pn" required></label><label class="fl"><span>Data urodzenia</span><input class="pu" type="date" required></label></div>';
      box.appendChild(d);
    }
    $$('.pers',box).forEach(function(p,i){if(i>=ile-1)p.remove()});
  }
  function refresh(){
    var total=CENA*ile;
    $('#ile').textContent=ile;
    $('#minus').disabled=ile<=1;$('#plus').disabled=ile>=MAX;
    $('#sum').textContent=fmt(total);
    $('#u-term').textContent=val('termin')+', wyjazd: '+val('skad');
    $('#u-os').textContent=persons().join(', ')+' ('+ile+' os.)';
    $('#u-cena').textContent=ile+' × '+fmt(CENA)+' = '+fmt(total);
    var nazw=$('#f-nazw').value.trim();
    $('#b-tyt').textContent='Gietrzwałd 18-21.09.2026'+(nazw?' - '+$('#f-imie').value.trim()+' '+nazw:'');
    $('#b-kw').textContent=fmt(total);
    var pl=val('plat');
    $('#p-przelew').classList.toggle('on',pl==='przelew');
    $('#p-online').classList.toggle('on',pl==='online');
    var c2=$('#c2').checked,pod=$('#podpis');
    pod.classList.toggle('on',c2);
    if(c2){var d=new Date();pod.textContent='Podpisano elektronicznie: '+persons()[0]+', '+d.toLocaleDateString('pl-PL')+', godz. '+d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}
  }
  function trasa(){
    var s=stations[cur-1];
    pk.style.left=s.x+'%';
    pk.style.top=(s.y-31)+'px';
    var n=cur,d='M'+pathX[0]+' '+pathY[0];
    for(var i=1;i<=n;i++)d+=' L'+pathX[i]+' '+pathY[i];
    trDone.setAttribute('d',d);
    $$('.trasa .dot',bk).forEach(function(el,i){el.classList.toggle('ok',i<cur)});
    $$('.trasa .st',bk).forEach(function(el,i){el.classList.toggle('on',i===cur-1);el.classList.toggle('ok',i<cur-1)});
  }
  function show(n){
    cur=n;
    $$('.bk-step',bk).forEach(function(s){s.classList.toggle('on',+s.getAttribute('data-step')===n)});
    $('#back').hidden=(n===1||n===4);
    var nx=$('#next');
    nx.textContent=n===3?'Potwierdzam zapis':n===4?'Zamknij':'Dalej';
    $('#bk-sum').style.visibility=n===4?'hidden':'visible';
    $('#bk-body').scrollTop=0;
    trasa();refresh();
  }
  function validate2(){
    var ok=true,first=null;
    $$('[data-step="2"] [required]',bk).forEach(function(i){
      var v=i.value.trim(),b=!v||(i.type==='email'&&!/^\S+@\S+\.\S+$/.test(v));
      i.parentNode.classList.toggle('err',b);
      if(b){ok=false;first=first||i}
    });
    ['c1','c2'].forEach(function(id){var c=$('#'+id),b=!c.checked;$('#'+id+'w').classList.toggle('err',b);if(b){ok=false;first=first||c}});
    if(first){first.focus({preventScroll:true});first.scrollIntoView({block:'center',behavior:'smooth'})}
    return ok;
  }
  function finish(){
    var total=CENA*ile,pl=val('plat');
    var nr='ODK/2026/'+String(Math.floor(Math.random()*900)+100);
    $('#ok-txt').textContent=pl==='przelew'
      ?'Numer zapisu '+nr+'. Umowę i dane do przelewu wysłaliśmy na '+($('#f-mail').value.trim()||'Twój e-mail')+'.'
      :'Numer zapisu '+nr+'. W docelowej stronie w tym miejscu otworzy się bramka płatności ('+val('metoda')+'), a po opłaceniu przyjdzie potwierdzenie i umowa.';
    var rows=[['Wyjazd','Gietrzwałd, Sokółka, Święta Lipka'],['Termin',val('termin')],['Miejsce wyjazdu',val('skad')],['Uczestnicy',persons().join(', ')],['Kwota',fmt(total)],['Płatność',pl==='przelew'?'przelew tradycyjny':'online: '+val('metoda')]];
    $('#ok-dl').innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+r[1].replace(/[<>&]/g,'')+'</dd>'}).join('');
  }

  var scrollY0=0;
  function open(){
    scrollY0=window.scrollY;
    if(typeof bk.showModal==='function')bk.showModal();else bk.setAttribute('open','');
    document.documentElement.style.overflow='hidden';
    show(1);
  }
  function close(){
    if(bk.open){if(typeof bk.close==='function')bk.close();else bk.removeAttribute('open')}
  }
  bk.addEventListener('close',function(){document.documentElement.style.overflow=''});
  bk.addEventListener('click',function(e){if(e.target===bk)close()});
  $$('[data-rezerwuj]').forEach(function(b){b.addEventListener('click',open)});
  $('#bk-x').addEventListener('click',close);
  $('#minus').addEventListener('click',function(){if(ile>1){ile--;renderPers();refresh()}});
  $('#plus').addEventListener('click',function(){if(ile<MAX){ile++;renderPers();refresh()}});
  bk.addEventListener('input',function(e){if(e.target.parentNode)e.target.parentNode.classList.remove('err');refresh()});
  bk.addEventListener('change',function(e){if(e.target.type==='checkbox')$('#'+e.target.id+'w')&&$('#'+e.target.id+'w').classList.remove('err');refresh()});
  $('#back').addEventListener('click',function(){if(cur>1)show(cur-1)});
  $('#next').addEventListener('click',function(){
    if(cur===1)show(2);
    else if(cur===2){if(validate2())show(3)}
    else if(cur===3){finish();show(4)}
    else close();
  });
  renderPers();refresh();
})();
