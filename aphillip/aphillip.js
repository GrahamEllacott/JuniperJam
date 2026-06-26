class SoundManager
{
    constructor()
    {
        this.sounds={};
        this.enabled=true;
    }
    
    addSound(key,sound)
    {
        this.sounds[key]=sound;
    }
    
    play(key)
    {
        if(this.enabled)
            Sound.sounds[key].play();
    }
}

var Sound=new SoundManager();

async function setupAPhillip(scene) {
 
  const audioEngine = await BABYLON.CreateAudioEngineAsync();
  Sound.addSound("bgm",await BABYLON.CreateSoundAsync("bgm","aphillip/audio/bgm.mp3",{ maxInstances: 1, loop:true }));
  Sound.addSound("small_explosion",await BABYLON.CreateSoundAsync("small_explosion","aphillip/audio/small_explosion.mp3",{ maxInstances: 1 }));
  Sound.addSound("big_explosion",await BABYLON.CreateSoundAsync("big_explosion","aphillip/audio/big_explosion.mp3",{ maxInstances: 1 }));
  Sound.addSound("shoot",await BABYLON.CreateSoundAsync("shoot","aphillip/audio/shoot.mp3",{ maxInstances: 1 }));
  Sound.addSound("rocket",await BABYLON.CreateSoundAsync("rocket","aphillip/audio/rocket.mp3",{ maxInstances: 1 }));
  Sound.addSound("laser_blade",await BABYLON.CreateSoundAsync("laser_blade","aphillip/audio/laser_blade.mp3",{ maxInstances: 1 }));
          
  await audioEngine.unlockAsync();
  
  Sound.play("bgm");

} // DO NOT ERASE THIS

