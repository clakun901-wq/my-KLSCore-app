var _tab6=tab;tab=function(i){_tab6(i);$('v6').hidden=i!=6;$('t6').setAttribute('aria-selected',i==6);TO.forEach(function(id){var b=$(id);b.tabIndex=b.getAttribute('aria-selected')=='true'?0:-1});if(i==6)ERP.show()};
$('t6').onclick=function(){tab(6)};
tbuild();
(function(){var d=null;try{d=JSON.parse(KStore.getItem('kalsara_v3')||'null')}catch(e){}
 if(d)applyState(d);else{fill();add();add();upd(false)}tab(0);obInit();syLocal();bkRemind()})();
