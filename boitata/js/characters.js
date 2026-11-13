/* A trilha é o histórico físico compartilhado: cabeça + corpo/cabelo. */
Boitata.Characters={
 registry:new Map(),
 register(character){if(!character.id||typeof character.model!=='function')throw Error('Guardião inválido');this.registry.set(character.id,character);},
 get(id=Boitata.S.save?.character){return this.registry.get(id)||this.registry.get('boitata');},
 select(id){if(!this.registry.has(id))return false;Boitata.S.save.character=id;Boitata.Store.write();return true;},
 points(s,alpha){return s.snake.map((p,i)=>{const old=s.oldSnake[i]||s.oldSnake.at(-1)||p;return {x:old.x+(p.x-old.x)*alpha+.5,y:old.y+(p.y-old.y)*alpha+.5,z:.45};});},
 record(){const s=Boitata.S,id=this.get().id;s.save.characterBest||={};s.save.characterBest[id]=Math.max(s.save.characterBest[id]||0,s.score);s.save.best=Math.max(s.save.best,s.score);return Boitata.Store.write();}
};
