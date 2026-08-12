
var Sound = new function(){

	this.on = true;

	this.master = this.on;
	this.slave = this.on;

	this.setMasterMute = (muted = false) => {
		this.master = !muted;
		this.updateMute();
	}
	
	this.setMute = (muted = false) => {
		this.slave = !muted;
		this.updateMute();
	}

	this.updateMute = () => {
		this.on = this.master && this.slave;
	}
}


Sound.Play = function(type, volume){
	if (typeof(volume)==='undefined') {
		volume = 1;
	}

	if (Sound.on) {			
		var sound = new Phaser.Sound(game, type, volume);
		sound.play();
		//console.log("playing sound: " + type);				
	}
}

Sound.resumeAudio = function() {
	try {
		if (this.isSuspended()) {
			game.sound.context.resume();
		}
	} catch(e) {}
}

Sound.unlockAudio = function() {
	Sound.resumeAudio();
	clearInterval(Sound.intervalId);
	Sound.intervalId = undefined;
}

Sound.checkAudioContext = function() {
	if (this.isSuspended()) {
		this.startCheckingSuspended();
	}
}

Sound.startCheckingSuspended = function() {
	clearInterval(this.intervalId);

	this.intervalId = setInterval(() => {
		if (this.isSuspended()) {
			game.sound.context.resume();
		} else {
			clearInterval(this.intervalId);
		}
	}, 1000);
}

Sound.isSuspended = function() {
	return game.sound.usingWebAudio && game.sound.context.state === 'suspended';
}

['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach(function(evt) {
	document.addEventListener(evt, Sound.unlockAudio.bind(Sound), true);
});

setInterval(Sound.checkAudioContext.bind(Sound), 1000);
