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

  function fv(el){var c=el.firstElementChild;while(c&&c.hidden)c=c.nextElementSibling;return c}
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
        var f0=fv(el);var w=f0?f0.getBoundingClientRect().width+parseFloat(getComputedStyle(el).columnGap||0):el.clientWidth;
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
    var c=fv(el);if(!c)return;
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

  /* galeria na karcie wyjazdu: dowolna liczba zdjęć, licznik i miniatury budowane automatycznie */
  var gal=$('#gal');
  if(gal){
    var cnt=$('#galc'),figs=Array.prototype.slice.call(gal.children),tot=figs.length,th=$('#thumbs');
    var idx=function(){return Math.round(gal.scrollLeft/gal.clientWidth)};
    var upd=function(){var i=idx();cnt.textContent=(i+1)+' / '+tot;if(th)$$('button',th).forEach(function(b,k){b.classList.toggle('on',k===i)})};
    if(th){
      if(tot<2)th.remove();
      else figs.forEach(function(f,k){
        var im=$('img',f),b=document.createElement('button');
        b.type='button';b.setAttribute('aria-label','Zdjęcie '+(k+1));
        b.innerHTML='<img src="'+im.getAttribute('src')+'" alt="" loading="lazy">';
        b.addEventListener('click',function(){gal.scrollTo({left:k*gal.clientWidth,behavior:'smooth'})});
        th.appendChild(b);
      });
    }
    if(tot<2){$$('.gal .ga').forEach(function(b){b.hidden=true});cnt.hidden=true}
    rail(gal,upd);upd();
    $('.gal .ga.p').addEventListener('click',function(){gal.scrollBy({left:-gal.clientWidth,behavior:'smooth'})});
    $('.gal .ga.n').addEventListener('click',function(){gal.scrollBy({left:gal.clientWidth,behavior:'smooth'})});
  }

  /* zakładki jednodniowe / wielodniowe + filtr Polska / zagranica */
  $$('.tabs-row[data-filter]').forEach(function(row){
    var box=document.getElementById(row.getAttribute('data-filter'));if(!box)return;
    var empty=$('[data-empty="'+box.id+'"]');
    var kind='jedno',kraj='all';
    if(/wielo/.test(location.hash))kind='wielo';
    function apply(){
      var n=0;
      Array.prototype.forEach.call(box.children,function(c){
        var ok=c.getAttribute('data-kind')===kind&&(kraj==='all'||c.getAttribute('data-kraj')===kraj);
        c.hidden=!ok;if(ok)n++;
      });
      $$('.tabs button',row).forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-kind')===kind?'true':'false')});
      $$('.flt button',row).forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-kraj')===kraj?'true':'false')});
      if(empty)empty.classList.toggle('on',n===0);
      box.style.display=n===0?'none':'';
      box.scrollLeft=0;
      box.dispatchEvent(new Event('scroll'));
    }
    $$('.tabs button',row).forEach(function(b){b.addEventListener('click',function(){kind=b.getAttribute('data-kind');apply()})});
    $$('.flt button',row).forEach(function(b){b.addEventListener('click',function(){kraj=b.getAttribute('data-kraj');apply()})});
    apply();
  });

  /* okno "Zapytaj o wyjazd" */
  var ask=$('#ask');
  if(ask){
    var openAsk=function(trip){
      ask.classList.remove('sent');
      var f=$('#askf');f.reset();$$('.err',f).forEach(function(x){x.classList.remove('err')});
      $('#ask-trip').value=trip||'';
      document.body.classList.remove('menu-open');if(burger)burger.setAttribute('aria-expanded','false');
      if(typeof ask.showModal==='function')ask.showModal();else ask.setAttribute('open','');
      document.documentElement.style.overflow='hidden';
    };
    $$('[data-ask]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();openAsk(b.getAttribute('data-ask'))})});
    $$('[data-close]',ask).forEach(function(b){b.addEventListener('click',function(){ask.close?ask.close():ask.removeAttribute('open')})});
    ask.addEventListener('close',function(){document.documentElement.style.overflow=''});
    ask.addEventListener('click',function(e){if(e.target===ask)ask.close()});
    $('#askf').addEventListener('submit',function(e){
      e.preventDefault();var ok=true,first=null;
      $$('[required]',this).forEach(function(i){var b=!i.value.trim();i.parentNode.classList.toggle('err',b);if(b){ok=false;first=first||i}});
      if(!ok){first.focus();return}
      ask.classList.add('sent');
    });
    $('#askf').addEventListener('input',function(e){e.target.parentNode.classList.remove('err')});
  }

  /* katalog PDF: PDF.js wczytywany dopiero, gdy podgląd zbliża się do ekranu */
  var viewers=$$('.viewer[data-pdf]');
  if(viewers.length){
    var PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    var loading=null;
    var lib=function(){
      if(loading)return loading;
      loading=new Promise(function(res,rej){
        var s=document.createElement('script');s.src=PDFJS+'pdf.min.js';
        s.onload=function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';res(window.pdfjsLib)};
        s.onerror=rej;document.head.appendChild(s);
      });
      return loading;
    };
    var init=function(v){
      var stage=$('.v-stage',v),cv=$('canvas',v),ld=$('.v-load',v),pg=$('.v-pg',v),tt=$('.v-tot',v),bp=$('.ga.p',v),bn=$('.ga.n',v);
      var doc=null,cur=1,busy=false,want=0;
      var draw=function(n){
        if(!doc)return;
        if(busy){want=n;return}
        busy=true;cur=n;pg.textContent=n;bp.disabled=n<=1;bn.disabled=n>=doc.numPages;
        doc.getPage(n).then(function(p){
          var cs=getComputedStyle(stage);
          var W=stage.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
          var H=stage.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
          var v1=p.getViewport({scale:1}),sc=Math.min(W/v1.width,H/v1.height),dpr=Math.min(window.devicePixelRatio||1,2);
          var vp=p.getViewport({scale:sc*dpr});
          cv.width=vp.width;cv.height=vp.height;cv.style.width=Math.floor(vp.width/dpr)+'px';cv.style.height=Math.floor(vp.height/dpr)+'px';
          return p.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
        }).then(function(){ld.hidden=true;busy=false;if(want){var w=want;want=0;draw(w)}},function(){busy=false});
      };
      lib().then(function(pdfjs){return pdfjs.getDocument(v.getAttribute('data-pdf')).promise}).then(function(d){
        doc=d;tt.textContent=d.numPages;draw(1);
      }).catch(function(){ld.textContent='Nie udało się wczytać podglądu. Skorzystaj z przycisku „Pobierz katalog”.'});
      bp.addEventListener('click',function(){if(cur>1)draw(cur-1)});
      bn.addEventListener('click',function(){if(doc&&cur<doc.numPages)draw(cur+1)});
      var sx=null;
      stage.addEventListener('pointerdown',function(e){if(e.target.closest('.ga'))return;sx=e.clientX});
      stage.addEventListener('pointerup',function(e){if(sx===null)return;var dx=e.clientX-sx;sx=null;if(Math.abs(dx)>40){if(dx<0)bn.click();else bp.click()}});
      stage.addEventListener('pointercancel',function(){sx=null});
      var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){draw(cur)},200)});
    };
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);init(x.target)}})},{rootMargin:'400px 0px'});
      viewers.forEach(function(v){io.observe(v)});
    }else viewers.forEach(init);
  }

  /* zgody cookies + wtyczka Facebooka (ładowana dopiero po zgodzie) */
  var KEY='btodk-zgody',ck=$('#cookie');
  var getC=function(){try{return localStorage.getItem(KEY)}catch(e){return null}};
  var setC=function(v){try{localStorage.setItem(KEY,v)}catch(e){}};
  var fbLoad=function(){
    var fr=$('#fb-frame');if(!fr||$('iframe',fr))return;
    var w=Math.max(180,Math.min(500,Math.floor(fr.clientWidth))),h=Math.floor(fr.clientHeight);
    var src='https://www.facebook.com/plugins/page.php?href='+encodeURIComponent(fr.getAttribute('data-fb'))+'&tabs=timeline&width='+w+'&height='+h+'&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false';
    var ifr=document.createElement('iframe');
    ifr.src=src;ifr.title='Profil Biura Turystycznego Odkrywca na Facebooku';ifr.loading='lazy';
    ifr.setAttribute('allow','encrypted-media');ifr.setAttribute('scrolling','no');
    fr.innerHTML='';fr.appendChild(ifr);
  };
  var applyC=function(v){
    if(ck)ck.classList.toggle('on',!v);
    if(v==='all')fbLoad();
  };
  $$('[data-consent]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-consent');setC(v);applyC(v)})});
  $$('[data-cookies]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(ck)ck.classList.add('on')})});
  applyC(getC());

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
