/* Reapply the campaign's fixed orthographic framing when entering/leaving levels 5 and 6. */
(() => {
 const B=Boitata,F=B.Forest3D,base=F.draw;
 F.draw=function(t){const level=B.S.level?.id||0,arena=level===5||level===6;if(arena!==this.specialArenaZoom){this.specialArenaZoom=arena;const rect=this.canvas?.parentElement?.getBoundingClientRect();if(rect?.width&&rect?.height)this.fitCamera(rect.width/rect.height);}return base.call(this,t);};
})();
