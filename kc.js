var decay = {};
var kaizoCookiesVer = 'v1.0';
var kaizoCookies = null;

var kaizoWarning = false; //true;

//integration
if (typeof Cookieclysm === 'undefined') { window.Cookieclysm = null; }

//additional helper functions
var upgradeDescsToReplace = [];

function replaceDesc(name, toReplaceWith, keepFlavorText) {
	if (!Game.ready) { upgradeDescsToReplace.push([name, toReplaceWith]); return; } 
	if (keepFlavorText) { toReplaceWith += getFlavorText(Game.Upgrades[name]); }
	Game.Upgrades[name].baseDesc = toReplaceWith;
	Game.Upgrades[name].desc = toReplaceWith;
	Game.Upgrades[name].ddesc = toReplaceWith;
}
var achievDescsToReplace = [];
function replaceAchievDesc(name, toReplaceWith) {
	if (!Game.ready) { achievDescsToReplace.push([name, toReplaceWith]); return; }
	Game.Achievements[name].baseDesc = toReplaceWith;
	Game.Achievements[name].desc = toReplaceWith; 
	Game.Achievements[name].ddesc = toReplaceWith;
}
function addLoc(s,t){locStrings[s]=t??s;}
function auraDesc(id, str, actionStr) {
	addLoc(str);
	Game.dragonAuras[id].desc=loc(str);
	if (actionStr) { Game.dragonLevels[id+3].action = Game.dragonLevels[id+3].action.slice(0, Game.dragonLevels[id+3].action.indexOf('<small>'))+'<small>'+actionStr+'</small>'; }
}
function getFlavorText(upgrade) {
	return upgrade.desc.slice(upgrade.desc.indexOf('<q>'), upgrade.desc.length);
}
var cookieChanges = [];
function cookieChange(name, newPow) {
	if (!Game.ready) { cookieChanges.push([name, newPow]); }
	if (!Game.Upgrades[name]) { return false; }
	if (!(typeof Game.Upgrades[name].power == 'function')) { Game.Upgrades[name].power = newPow; } else {
		eval('Game.Upgrades["'+name+'"].power='+Game.Upgrades[name].power.toString().replace('var pow=2;', 'var pow='+newPow+';').replace(') pow=3;', ') pow=1.5*'+newPow+';'));
	}
	var flavorText = getFlavorText(Game.Upgrades[name]);
	Game.Upgrades[name].desc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
	Game.Upgrades[name].ddesc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
	Game.Upgrades[name].baseDesc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
}
function getVer(str) {
	if (str[0] !== 'v') { return false; }
	str = str.slice(1, str.length);
	str = str.split('.');
	for (let i in str) { str[i] = parseFloat(str[i]); }
	return str;
}
function isv(str) { //"isValid"
	if (typeof str === 'string') { 
		if (str.includes('NaN') || str.includes('undefined') || str === '') {
			return false;
		}
	}
	if (typeof str !== 'string' && isNaN(str)) { return false; }
	if (typeof str === 'undefined') { return false; }
	return true;
}
function selectStatement(str, index, beginningCount) {
	if (index == -1) { return false; }
	let count = 0;
	if (beginningCount) { count = beginningCount; }
	let inited = false;
	let start = index;
	let inStrSingle = false;
	let inStrDouble = false;
	let inStrTemplate = false;
	let inStr = function() { return (inStrSingle || inStrDouble || inStrTemplate); }
	while (true) {
		if (str[index] == '{' && !inStr()) { inited = true; count++; }
		if (str[index] == '}' && !inStr()) { count--; }
		let states = [!inStrSingle && !inStrDouble && !inStrTemplate, inStrSingle && !inStrDouble && !inStrTemplate, !inStrSingle && inStrDouble && !inStrTemplate, !inStrSingle && !inStrDouble && inStrTemplate];
		if (str[index] == "'" && states[0]) { inStrSingle = true; }
		if (str[index] == "'" && states[1]) { inStrSingle = false; }
		if (str[index] == '"' && states[0]) { inStrDouble = true; }
		if (str[index] == '"' && states[2]) { inStrDouble = false; }
		if (str[index] == '`' && states[0]) { inStrTemplate = true; }
		if (str[index] == '`' && states[3]) { inStrTemplate = false; }
		if (count <= 0 && inited) { break; } 
		if (index >= str.length) { break; }
		index++;
	}
	return str.slice(start, index) + '}';
}
function inRect(x,y,rect)
{
	//declaring this so wrinklers work
	var dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
	var h1 = Math.sqrt(dx*dx + dy*dy);
	var currA = Math.atan2(dy,dx);
	var newA = currA - rect.r;
	var x2 = Math.cos(newA) * h1;
	var y2 = Math.sin(newA) * h1;
	if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
	return false;
}
function geometricMean(arr) {
	var sum = 0; 
	var amountValid = 0;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] != 0) { sum += Math.log(arr[i]); amountValid++; }
	} 
	sum /= Math.max(1, amountValid);
	return Math.exp(sum) //wtf is an antilog
}
function cyclicDist(v1, v2, c) {
	//v1 - v2, but in the context of mod c
	return (c + v1 - v2) % c;
}
function avgColors(arr, returnOpacity) {
	//rgba format, a is in terms of 0-1
	var length = 0;
	for (let i in arr) {
		length += arr[i][3] ?? 1;
	}
	if (length == 0) {
		return (returnOpacity?[0, 0, 0, 0]:[0, 0, 0, 1]);
	}
	var toReturn = [0, 0, 0, 0];
	for (let i in arr) {
		if (typeof arr[i][3] !== 'undefined') {
			toReturn[0] += arr[i][0] * arr[i][3];
			toReturn[1] += arr[i][1] * arr[i][3];
			toReturn[2] += arr[i][2] * arr[i][3];
			toReturn[3] += arr[i][3];
		} else {
			toReturn[0] += arr[i][0];
			toReturn[1] += arr[i][1];
			toReturn[2] += arr[i][2];
			toReturn[3] += 1;
		}
	}
	return [toReturn[0] / length, toReturn[1] / length, toReturn[2] / length, (returnOpacity?Math.min(toReturn[3], 1):1)];
}
function colorToArray(color) {
    if (!/^#[0-9a-fA-F]{8}$/.test(color)) {
        throw new Error("Invalid color format. Use #RRGGBBAA.");
    }
    
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);
    const opacity = parseInt(color.slice(7, 9), 16);

    return [red, green, blue, opacity];
}
function colorCycleFrame(prev, post, fraction) {
	//"prev" and "post" must be arrays with 3 numbers for rgb
	prev[3] = prev[3] ?? 1;
	post[3] = post[3] ?? 1;
	return [prev[0] * (1 - fraction) + post[0] * fraction, prev[1] * (1 - fraction) + post[1] * fraction, prev[2] * (1 - fraction) + post[2] * fraction, prev[3] * (1 - fraction) + post[3] * fraction];
}

function allValues(checkpoint) {
	if (!decay.DEBUG) { return false; }
	var str = '[DEBUGGING: '+checkpoint+']';
	str += '\nCookies in bank: '+Game.cookies;
	str += '\nCBTA: '+Game.cookiesEarned;
	str += '\nCPS: '+Game.cookiesPs;
	str += '\nDecay general: '+decay.gen;
	str += '\nDecay momentum: '+decay.momentum;
	str += '\n[DEBUGGER OF '+checkpoint+' END]';
	console.log(str);
}

function transmuteChar(c) {
	c = c.toLowerCase();
	var l = ['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m'];
	l.splice(l.indexOf(c), 1);
	return choose(l);
}

if (!Game.styleSheets) {
	Game.styleSheets = null; 
	for (let i in document.styleSheets) { 
		try { if (document.styleSheets[i].cssRules.length > 500) { Game.styleSheets = document.styleSheets[i]; break; } } 
		catch(error) { } 
	} 
	if (Game.styleSheets === null) { Game.Notify('Unable to inject CSS!', 'Something went wrong. Please contact the mod developers. '); }
}
var cssList = '';
function injectCSS(str) {
	cssList += str+'\n';
}

function preLoads() {
	//stuff to strictly load before game is ready
	eval('Game.LoadSave='+Game.LoadSave.toString()
		.replace(`if (Game.mobile || Game.Has('Perfect idling') || Game.Has('Twin Gates of Transcendence'))`, `if (false)`)
		.replace(`if (Game.researchT>0) Game.researchT=Math.max(Game.researchT-framesElapsed,1);`, '')
	);
	for (let i in Game.wrinklers) {
		Game.wrinklers[i].close = 0;
		Game.wrinklers[i].sucked = 0;
		Game.wrinklers[i].phase = 0;
	}
	eval('Game.loadLumps='+Game.loadLumps.toString().replace('if (amount>=1)', 'if (false)'));
}

var gp = Game.Objects['Wizard tower'].minigame; //grimoire proxy
var pp = Game.Objects['Temple'].minigame; //pantheon proxy
var gap = Game.Objects['Farm'].minigame; //garden proxy
var sp = Game.Objects['Bank'].minigame; //stock market proxy
var grimoireUpdated = false;
var gardenUpdated = false;
var pantheonUpdated = false;
var stockUpdated = false;

Game.registerMod("Kaizo Cookies", { 
	name: 'Kaizo cookies',
	init: function() {
		if (kaizoCookies || l('topbarFrenzy')) { return; }
		if (!App) { Game.LoadMod('https://glander.club/asjs/9b1GUwLs'); }
		eval('Game.WriteSave='+Game.WriteSave.toString().replace(`Game.toSave=false;`, `if (window.isEE) { return ''; } Game.toSave=false;`));
		if (l('promptContentChangeLanguage')) { for (let i = 0; i < 30; i++) { Game.Notify('Please select a language before you load the mod!', '', 0); } }
		kaizoCookies = this;
		if (App) { if (CrumbsEngineLoaded) { this.header(); } else { Game.Notify('Incorrect loading order!', 'Please restart the game, and load Crumbs Engine before Kaizo cookies.', 0); } return; }
		if (typeof CrumbsEngineLoaded === 'undefined' || !CrumbsEngineLoaded) { 
			if (window.kaizo_load_local) { window.crumbs_load_local = window.kaizo_load_local; }
			try { Game.LoadMod((window.kaizo_load_local)?'./Crumbs.js':'https://cursedsliver.github.io/Crumbs-engine/Crumbs.js'); } catch (err) { Game.Notify('Crumbs engine failed to load!', 'Critical prerequisite failed to load; mod loading halted', 0); console.log(err); }
		}

		//the cccem solution, fixes import corruption on mod load
		if (!(typeof Game.Objects.Temple.minigame === "undefined")){Game.Objects.Temple.minigame.slot=[Game.Objects.Temple.minigame.slot[0],Game.Objects.Temple.minigame.slot[1],Game.Objects.Temple.minigame.slot[2]]};
		this.loadWrapper = function() {
			const checkPrerequisites = function() {
				if (typeof CrumbsEngineLoaded !== 'undefined' && CrumbsEngineLoaded && Game.ready) { 
					kaizoCookies.header(); 
					clearInterval(interval); 
				}
			}
			const interval = setInterval(checkPrerequisites, 10);
		}
		this.saveFile = localStorage.getItem('kaizoCookiesSave');
		let offendingMods = [];
		for (let i in Game.mods) {
			if (!this.exemptMods.includes(Game.mods[i].id)) { offendingMods.push(Game.mods[i].name); }
		}
		if (offendingMods.length) {
			this.modWarn(offendingMods);
		} else { 
			if (!localStorage.getItem('CookieClickerGame')) { Game.WriteSave(); } //this has a purpose, to stop the game from trying to load save a second time because the original save is absent
			this.callHeader();
		}
	},
	callHeader: function() {
		if (this.saveFile) {
			Game.LoadSave(this.saveFile);
			Game.SaveTo = 'kaizoCookiesSave';
			this.loadWrapper();
		} else {
			Game.Prompt(`<id kaizoFirstLoadConfirmPrompt><noClose><h3>Before you start...</h3><div class="block">
				Kaizo Cookies uses a different save slot than vanilla cookie clicker for your convenience. This means that:
				<div class="line"></div>
				Once you confirm this prompt, you will be placed into a <b>fresh save</b>, but your original save remains <b>untouched</b> and can be accessed at any time by simply <b>unloading</b> the mod.
				<br><br>You can unload the mod by ${App?'removing the mod from your modlist and restarting the game':'simply reloading, and removing it from your mod list if you are using a mod manager'}
				<br><br>Your Kaizo cookies save will <b>reappear</b> if the mod is loaded again on the same website, and this prompt will not appear again. Changing (or even wiping) the original save or the Kaizo cookies save have no effect on the other. 
				${App?'':'<br><br>If you wish to play on your Kaizo save while simultaneously having your main save open, you can open two tabs of your game, then loading the mod on one; or alternatively, you can use a different site to host your Kaizo cookies save, such as <a href="https://cookieclicker.eu/cookieclicker/" target="_blank" class="highlightHover">cookieclicker.eu</a> or <a href="https://cdn.dashnet.org/cookieclicker/" target="_blank" class="highlightHover">cdn.dashnet.org</a>.'}
				<br><br>Because this is a content mod, you will <b>start again from scratch</b>, and your original progress <b>will not</b> carry into your new save. 
				<br><br>While you may export and import your main save into the new save, doing so is <b>highly discouraged</b>, is <b>cheating</b>, and will likely <b>heavily break the game</b>.
				<div class="line"></div>
				Once you've read and understood the above, click <b>Let\'s go!</b> to start playing. Enjoy! 
			</div>`, [['Let\'s go!', 'Game.HardReset(2); Game.SaveTo = "kaizoCookiesSave"; kaizoCookies.loadWrapper(); Game.ClosePrompt();'], ['Nevermind', 'Game.ClosePrompt();']], 0, 'widePrompt');
		}
	},
	modWarn: function(modList) {
		Game.Prompt(`<id kaizoModConflictPrompt><noClose><h3>Hold it!</h3><div class="block">
			Mod loading has been stopped due to the presence of other mods, which may have <b>unintended consequences</b> when combined with Kaizo cookies, potentially leading to <b>save corruption</b> and a myriad of other issues. 
			<br><br>We recommend that you <b>unload</b> all unnecessary mods before loading Kaizo cookies${App?', which includes all mods that aren\'t a prerequisite as listed on the Steam workshop page':''}. You can unload mods by ${App?'removing the mod from your modlist and restarting the game':'simply reloading, and removing it from your mod list if you are using a mod manager'}.
			<br><br>Close the game ASAP and remove other mods before loading Kaizo cookies again. However, if you really insist, you may continue loading Kaizo cookies anyways with the "I know what I'm doing!" button below, but we will not be responsible for any issues that arised from such mod conflicts.
			<br><br>If you are a mod creator, you can have your mod be approved if it works well with Kaizo cookies, making having your mod loaded no longer trigger this prompt.
			</div><div class="block">
			<b>Potentially offending mods:</b> ${modList.join(', ')}
		</div>`, [['Ok', 'Game.ClosePrompt();'], ['I know what I\'m doing!', 'Game.ClosePrompt(); kaizoCookies.callHeader();']], 0, 'widePrompt');
	},
	exemptMods: ['Kaizo Cookies', 'Crumbs engine', 'buffTimerFix', 'P for Pause'],
	header: function() {
		if (kaizoCookies.warn) { console.log('header reactivation attempted!'); return; }
		preLoads();
		
        // notification!
		//Game.Notify(`Oh, so you think comp is too easy?`, `Good luck.`, [21,32],10,1);

		//uhhhhh
		Game.priceIncrease = 1.1475;

		this.actualModObj = decay;

		//anti mhur
		Game.firstHC = 10000000;
		Game.HowMuchPrestige = function(cookies) { return Math.pow(cookies/Game.firstHC,1/Game.HCfactor); }
		eval('Game.HowManyCookiesReset='+Game.HowManyCookiesReset.toString().replace('1000000000000', 'Game.firstHC'));
		Game.HCfactor = 4;

		eval('Game.BuildAscendTree='+Game.BuildAscendTree.toString().replace('writeIcon(me.icon)', '""')); 

		eval('Game.Logic='+Game.Logic.toString().replace('Game.CanClick=1;', 'Game.CanClick=1; if (kaizoWarning && Game.T%15==0) { kaizoCookies.warn(); }'));
		this.warn = function() {
			//Game.Notify('WARNING', 'We\'ve detected that you are loading this mod on a progressed save, which can lead to unknown issues and corrupted saves. Please IMMEDIATELY quit and <b>load this mod on a NEW SAVE</b>!', [1, 7], 1e21, 0, true);
		}

		//no more ads (requested by fifi)
		l('smallSupport').style.display = 'none';
		l('support').style.display = 'none';

		eval('Game.bakeryNameRefresh='+Game.bakeryNameRefresh.toString().replaceAll('saysopensesame', 'saysclosesesame'));
		if (!(Game.bakeryName.indexOf('saysclosesesame') > 0)) { 
			//disable sesame to discourage cheating
			//this is to incentivize new players to actually play the game instead of scanning the game for content and then losing enjoyment because theyve already seen it all
			Game.sesame = 0;
			if (l('debug')) { l('debug').style.display = 'none'; }
			//maybe later have a warning pop up when importing a save without kaizo mod data
		}

		this.images = {
			custImg: window.kaizo_load_local?'/img/modicons.png':(App?this.dir+'/modicons.png':'https://cursedsliver.github.io/asdoindwalk/modicons.png'),
			bigGolden: App?this.dir+'/bigGoldenCookie.png':'https://cursedsliver.github.io/asdoindwalk/bigGoldenCookie.png',
			bigWrath: App?this.dir+'/bigWrathCookie.png':'https://cursedsliver.github.io/asdoindwalk/bigWrathCookie.png',
			classic: App?this.dir+'/classicCookie.png':'https://cursedsliver.github.io/asdoindwalk/classicCookie.png',
			yeetDragon: App?this.dir+'/yeetDragonCookie.png':'https://cursedsliver.github.io/asdoindwalk/yeetDragonCookie.png',
			minecraft: App?this.dir+'/minecraftCookie.png':'https://cursedsliver.github.io/asdoindwalk/minecraftCookie.png',
			terraria: App?this.dir+'/Chocolate_Chip_Cookie.png':'https://cursedsliver.github.io/asdoindwalk/Chocolate_Chip_Cookie.png',
			cursed: App?this.dir+'/cursed.gif':'https://cursedsliver.github.io/asdoindwalk/cursed.gif',
			powerGradient: App?this.dir+'/powerGradient.png':'https://cursedsliver.github.io/asdoindwalk/powerGradient.png',
			powerOrb: App?this.dir+'/realOrb.png':'https://cursedsliver.github.io/asdoindwalk/realOrb.png',
			powerGradientBlue: App?this.dir+'/powerGradientBlue.png':'https://cursedsliver.github.io/asdoindwalk/powerGradientBlue.png',
			powerGradientRed: App?this.dir+'/powerGradientRed.png':'https://cursedsliver.github.io/asdoindwalk/powerGradientRed.png',
			reingold: App?this.dir+'/reingold.png':'https://cursedsliver.github.io/asdoindwalk/reingold.png',
			wrinklerSoul: App?this.dir+'/wrinklerSoul.png':'https://cursedsliver.github.io/asdoindwalk/wrinkler%20soul.png',
			shinySoul: App?this.dir+'/shinySoul.png':'https://cursedsliver.github.io/asdoindwalk/shinysoul.png',
			wrinklerSplits: App?this.dir+'/wrinklerSplits.png':'https://cursedsliver.github.io/asdoindwalk/wrinklerSplits.png',
			utenglobe: App?this.dir+'/utenglobe.png':'https://cursedsliver.github.io/asdoindwalk/utenglobe.png',
			glow: App?this.dir+'/glow.png':'https://cursedsliver.github.io/asdoindwalk/glow.png',
			bomberParticle: App?this.dir+'/randomParticle.png':'https://cursedsliver.github.io/asdoindwalk/randomParticle.png',
			winterShinyWrinkler: App?this.dir+'/winterShinyWrinkler.png':'https://cursedsliver.github.io/asdoindwalk/winterShinyWrinkler.png',
			winterShinyWinkler: App?this.dir+'/winterShinyWrinkler.png':'https://cursedsliver.github.io/asdoindwalk/winterShinyWinkler.png',
			heavenRing1Png: App?this.dir+'/heavenRing1Modified.png':'https://cursedsliver.github.io/asdoindwalk/heavenRing1Modified.png',
			heavenRing2Png: App?this.dir+'/heavenRing2Modified.png':'https://cursedsliver.github.io/asdoindwalk/heavenRing2Modified.png',
			buildingIcon: App?this.dir+'/buildersmall.png':'https://cursedsliver.github.io/asdoindwalk/buildersmall.png',
			crosshair: App?this.dir+'/crosshair.png':'https://cursedsliver.github.io/asdoindwalk/crosshair.png',
			eightBitCookie: App?this.dir+'/8bitCookie.png':'https://cursedsliver.github.io/asdoindwalk/8bitCookie.png',
			decayGlint: App?this.dir+'/decay_light_glint.png':'https://cursedsliver.github.io/asdoindwalk/decay_light_glint.png',
			wrinklerOutline: App?this.dir+'/wrinklerOutline.png':'https://cursedsliver.github.io/asdoindwalk/wrinklerOutline.png',
			windParticle: App?this.dir+'/windParticle.png':'https://cursedsliver.github.io/asdoindwalk/windParticle.png'
		};
		Crumbs.preload([this.images.powerGradientBlue, this.images.powerGradientRed, this.images.heavenRing1Png, this.images.heavenRing2Png, this.images.wrinklerSoul, this.images.shinySoul]);
		decay.timePlayed = 0; //amount of time (not frames uses deltatime) while game active
		Game.registerHook('logic', function() { if (Game.deltaTime < 1000) { decay.timePlayed += Game.deltaTime; } });

		//loading everything queued
		this.loadAllChanges = function() {
			for (let i in upgradeDescsToReplace) {
				replaceDesc(upgradeDescsToReplace[i][0], upgradeDescsToReplace[i][1]);
			}
			for (let i in achievDescsToReplace) {
				replaceAchievDesc(achievDescsToReplace[i][0], achievDescsToReplace[i][1]);
			}
			for (let i in cookieChanges) {
				cookieChange(cookieChanges[i][0], cookieChanges[i][1]);
			}
		} 
		if (!Game.ready) { Game.registerHook('create', this.loadAllChanges); } else { this.loadAllChanges(); }

		//prerequisite mods
		Game.lastTimestamp = 0;
		Game.deltaTime = 0; //ms
		if (!App) { 
			eval('Game.Loop='+Game.Loop.toString().replace(`Timer.say('START');`,`const startTimestamp=Date.now();Timer.say('START');`).replace('setTimeout(Game.Loop,1000/Game.fps);','Game.deltaTime = Date.now()-Game.lastTimestamp; Game.lastTimestamp = startTimestamp; setTimeout(Game.Loop,Math.max(1000/Game.fps-(Date.now()-startTimestamp),0)); '));  //FPSTweaker
			if (window.kaizo_load_externals_from_internal) {
				Game.LoadMod(`./PForPause.js`); 
				Game.LoadMod('./buffTimer.js');
				//Game.LoadMod('./dethrottler.js');
			} else {
				try { Game.LoadMod('https://cursedsliver.github.io/asdoindwalk/PForPause.js'); } catch (err) { Game.Notify('P for Pause failed to load!', 'Please contact the developers about it. (find in info menu)', 0); console.log(err); }
				//Game.LoadMod(`https://glander.club/asjs/qdNgUW9y`); 
				try { Game.LoadMod('https://hellopir2.github.io/cc-mods/buffTimer.js'); } catch (err) { Game.Notify('P for Pause failed to load!', 'Please contact the developers about it. (find in info menu)', 0); console.log(err); }
			}
			Game.registerHook('logic', function() {
				if (typeof changeKeyBind != 'undefined') { changeKeyBind = 1; }
			});
			AddEvent(window,'keydown',function(e){
				if (!window.PauseGame) { return; }
				let hasTriggered = false;
    			if (e.key?.toLowerCase()=='c' && (e.shiftKey || Game.keys[16])) { hasTriggered = true; } 
				if (e.key?.toLowerCase()=='p' && (e.shiftKey || Game.keys[16])) { hasTriggered = true; } 
				
				if (!hasTriggered) { return; }
				kaizoCookies.togglePause();
				Game.UpdateMenu();
			});
			if (Crumbs.mobile) {
				let metaTag = document.createElement('meta');
				metaTag.name = 'viewport';
				metaTag.content = 'initial-scale=0.5';

				document.head.appendChild(metaTag);
			}
			l('wrapper').style.touchAction = 'none'; //'manipulation';
			l('wrapper').style.webkitUserSelect = 'none';
			l('wrapper').style.userSelect = 'none';
		}
		this.paused = false;
		this.lastPause = 0;
		addLoc('Too soon!');
		this.prepauseAllowanceSettings = {};
		decay.pausingCooldown = 0;
		addLoc('On cooldown (%1s left)');
		this.togglePause = function() {
			if (Game.OnAscend) { return; }
			if (Game.T - kaizoCookies.lastPause < 0.2 * Game.fps && !kaizoCookies.paused) { Game.Notify(loc('Too soon!'), '', 0, 1); return; }
			if (kaizoCookies.paused) { 
				kaizoCookies.unpauseGame(); 
			} else {
				if (decay.pausingCooldown && decay.prefs.comp) { Game.Notify(loc('On cooldown (%1s left)', Beautify(decay.pausingCooldown / Game.fps)), '', 0, 1); return; }
				if (decay.prefs.comp) { decay.pausingCooldown = 90 * Game.fps; }
				kaizoCookies.pauseGame(); 
			}
			kaizoCookies.lastPause = Game.T;
		}
		Game.registerHook('logic', function() {
			if (decay.pausingCooldown) { decay.pausingCooldown--; }
		});
		this.skippedGameCanOnPause = ['openStats', 'closeNotifs'];
		this.skippedGameCanOnPauseWithEasyPurchases = ['openStats', 'closeNotifs', 'buyUpgrades', 'buyAllUpgrades', 'castSpells', 'changeTickspeed', 'closeMinigames', 'interactDragon', 'levelUpBuildings', 'plant', 'refillMinigames', 'scrollNews', 'selectSeeds', 'sellGoods', 'slotAuras', 'slotGods', 'takeLoans', 'toggleAutoClaim', 'togglePowerchannel', 'toggleUpgrades', 'upgradeOffice', 'useGardenTools', 'viewMinigames'];
		let gamePauseL = document.createElement('div');
		addLoc('GAME PAUSED');
		addLoc('(Shift + C to pause or unpause)');
		gamePauseL.innerHTML = '<div style="font-size: 16px; text-align: right; line-height: 20px;">'+loc('(Shift + C to pause or unpause)')+'</div>'+loc('GAME PAUSED');
		gamePauseL.id = 'gamePauseText';
		gamePauseL.classList.add('title');
		gamePauseL.classList.add('gamePauseText');
		injectCSS('.gamePauseText { pointer-events: none; position: absolute; bottom: 10px; right: 24px; padding: 10px; z-index: 100000; font-size: 60px; font-family: \'Merriweather\', Georgia,serif; font-style: bold; text-shadow:0px 1px 8px #000, 0px -1px 8px #ff0000; }');
		l('game').appendChild(gamePauseL);
		decay.gamePauseL = gamePauseL;
		decay.gamePausedCount = 0;
		decay.gamePauseL.style.display = 'none';
		this.pauseGame = function() {
			if (kaizoCookies.paused) { return; }
			if (!window.PauseGame) { Game.Notify('Prerequisite mod not yet loaded!', 'You cannot pause the game yet, as P for Pause has not yet been loaded. If this continues, check your internet connection.', 0, 4); return; }
			decay.gamePausedCount++;
			PauseGame();
			kaizoCookies.paused = true;
			for (let i in decay.gameCan) {
				kaizoCookies.prepauseAllowanceSettings[i] = decay.gameCan[i];
				if (!kaizoCookies[decay.prefs.easyPurchases?'skippedGameCanOnPauseWithEasyPurchases':'skippedGameCanOnPause'].includes(i)) { decay.gameCan[i] = false; }
			}
			if (!Crumbs.mobile) { decay.gamePauseL.style.display = ''; }
		}
		this.unpauseGame = function() {
			if (!kaizoCookies.paused) { return; }
			PauseGame();
			kaizoCookies.paused = false;
			for (let i in decay.gameCan) {
				decay.gameCan[i] = kaizoCookies.prepauseAllowanceSettings[i];
			}
			if (!Crumbs.mobile) { decay.gamePauseL.style.display = 'none'; }
		}
		eval('Game.Upgrade.prototype.buy='+Game.Upgrade.prototype.buy.toString().replace('if (this.bought && this.activateFunction) this.activateFunction();', 'if (this.bought && this.activateFunction) this.activateFunction(); if (kaizoCookies.paused && success) { Game.RebuildUpgrades(); }'));
		addLoc('It looks like you weren\'t there, so your game was paused automatically!');
		decay.lastVisible = Date.now();
		Game.visible = !document.hidden;
		Game.registerHook('logic', function() {
			if (Game.visible) { 
				decay.lastVisible = Date.now();
				return;
			}
			if (decay.prefs.autoPause && !kaizoCookies.paused && !Game.OnAscend && (Crumbs.lastUpdate + 5000 < Date.now() || decay.lastVisible + 5000 < Date.now())) { 
				if (decay.pausingCooldown && decay.prefs.autoPause) { return; }
				Game.Notify(loc('Game automatically paused'), loc('It looks like you weren\'t there, so your game was paused automatically!'), 0);
				kaizoCookies.pauseGame();
			}
		})
		addLoc('Assist option; shortcuts: Shift+C OR Shift+P');
		addLoc('Pause'); addLoc('Unpause');
		addLoc('Times paused: ');
		eval('Game.DrawWrinklers='+Game.DrawWrinklers.toString().replace('if (Game.prefs.particles', 'if (Game.prefs.particles && !kaizoCookies.paused'));
		AddEvent(document, 'mousemove', function() { if (kaizoCookies.paused) { Game.tooltip.update(); } });
		AddEvent(document, 'keyup', function(e) {
			if (!kaizoCookies.paused) { return; }
			if (!Game.promptOn)
			{
				if ((e.shiftKey || e.ctrlKey) && !Game.buyBulkShortcut)
				{
					Game.buyBulkOld=Game.buyBulk;
					if (e.shiftKey) Game.buyBulk=100;
					if (e.ctrlKey) Game.buyBulk=10;
					Game.buyBulkShortcut=1;
					Game.storeBulkButton(-1);
				}
			}
			if ((!e.shiftKey && !e.ctrlKey) && Game.buyBulkShortcut)
			{
				Game.buyBulk=Game.buyBulkOld;
				Game.buyBulkShortcut=0;
				Game.storeBulkButton(-1);
			}
			for (let i in Game.Objects) { Game.Objects[i].refresh(); }
		});
		eval('Game.ImportSaveCode='+Game.ImportSaveCode.toString().replace('var out=false;', 'var out=false; kaizoCookies.unpauseGame();'));

		let mousePosDiv = document.createElement('div');
		mousePosDiv.id = 'mousePosDisplay';
		mousePosDiv.style.position = 'absolute';
		mousePosDiv.style.top = '10px';
		mousePosDiv.style.right = '10px';
		mousePosDiv.style.background = 'rgba(0,0,0,0.7)';
		mousePosDiv.style.color = '#fff';
		mousePosDiv.style.padding = '6px 12px';
		mousePosDiv.style.borderRadius = '8px';
		mousePosDiv.style.fontSize = '14px';
		mousePosDiv.style.zIndex = 1000000;
		mousePosDiv.style.pointerEvents = 'none';
		if (true) { //disable later
			l('game').appendChild(mousePosDiv);  

			l('game').addEventListener('mousemove', function(e) {
				//mousePosDiv.innerHTML = `Main: (${e.clientX}, ${e.clientY})<br>Left: (${Crumbs.scopedCanvas.left.mouseX}, ${Crumbs.scopedCanvas.left.mouseY})`;
				mousePosDiv.innerText = `Click: ${Crumbs.pointerHold?'yes':'no'}`;
			}); 

			Game.registerHook('logic', function() {
				mousePosDiv.innerText = `Click: ${Crumbs.pointerHold?'yes':'no'}`;
			})
		}

		//overriding notification so some really important notifs can last for any amount of time even with quick notes on
		eval('Game.Notify='+Game.Notify.toString().replace('quick,noLog', 'quick,noLog,forceStay').replace('if (Game.prefs.notifs)', 'if (Game.prefs.notifs && (!forceStay))').replace('if (Game.popups) new Game.Note(title,desc,pic,quick);', 'if (Game.popups) var note = new Game.Note(title,desc,pic,quick);').replace('if (!noLog)', 'if (forceStay && quick > 1e6 && note) { note.rainbow = true; Game.UpdateNotes(); } if (!noLog)'));
		injectCSS('.noteRainbow { border: 3px ridge white; animation: rainbowCycleBorder 8s infinite ease-in-out; }');
		eval('Game.UpdateNotes='+Game.UpdateNotes.toString().replace(`me.desc!=''?'hasdesc':'nodesc')+'`, `me.desc!=''?'hasdesc':'nodesc')+(me.rainbow?' noteRainbow':'')+'`));

		/*=====================================================================================
        Decay
        =======================================================================================*/
		//the decay object is declared outside of the mod object for conveience purposes
		//decay: a decreasing multiplier to buildings, and theres a different mult for each building. The mult decreases the same way for each building tho
		decay.mults = []; for (let i in Game.Objects) { decay.mults.push(1); } 
		decay.mults.push(1); //the "general multiplier", is just used for checks elsewhere (and "egg")
		decay.gen = decay.mults[20];
		decay.multsLastIndex = 20; 
		decay.incMult = 0.04; //decay mult is decreased by this multiplicative every second
		decay.min = 0.15; //the minimum power that the update function uses; the lower it is, the slower the decay will pick up
		decay.rateTS = 1; //tickspeed
		decay.halts = {}; //simulates decay stopping from clicking (simulated below)
		decay.effectiveHalt = 0; //the amount of halt that comes out in the end, can be any positive number really
        decay.requiredHalt = 1; //the amount of halting power required to fully halt
		decay.decHalt = 1; //the amount that every halt channel decreases by every second by default
		decay.haltDecMin = 0.05; //minimum value of decay.decHalt
		decay.fatigue = 0; //at 1000, become fatigued
		decay.fatigueMax = 1000; //the point in which you become exhausted
		decay.clickWork = 1.4; //the base amount of work that each click does
		decay.workProgressMult = 1; //the multiplier to work done (each click) via progression (e.g. cookies earned this ascend)
		decay.exhaustion = 0; //buff like timer that counts down by 1 every frame, represents the fatigued state of being unable to halt decay via clicking
		decay.exhaustionBegin = 25 * Game.fps; //the initial amount of exhaustion set
		decay.exhaustionBeginMult = 1; //mult that is dynamically changed
		decay.broken = 1; //represents the current boost to decay propagation from the breaking point mechanic (^2 in the case of rate, ^0.5 in the case of momentum) and halting requirement 
		decay.breakingPoint = 0.1; //if decay.gen is below this, decay is considered broken
		decay.brokenMult = 1; //multiplier to the effect of decay.broken after it is broken
		decay.momentum = 1; //increases with each game tick, but decreased on certain actions (hardcoded to be at least 1)
		decay.momentumTS = 1; //tickspeed
		decay.TSMultFromMomentum = 1; //tickspeed
		decay.smoothMomentumFactor = 0.15; //some momentum is negated so it isnt very obvious with the log scaling; the less it is, the smoother it will be (not necessarily a good thing as it also delays momentum)
		decay.momentumFactor = 2; //the more this is, the less powerful momentum is (very strongly affects momentum)
		decay.momentumIncFactor = 1.5; //the larger, the less momentum increases (straight mult)
		decay.momentumLogInc = 2.5; //directly affects momentum increase (instead of momentum interpretation)
		decay.clickHaltBaseTime = 1; //amount of halting applied with no bonuses per click
		decay.purityToDecayPow = 1.5; //purity multiplies decay rate to this power
		decay.purityToMomentumPow = 2; //purity multiplies decay momentum to this power
		decay.unshackledPurityMult = 0.75; //unshackled purity upgrade
		decay.momentumOnHaltBuffer = 2; //for its effect on halting, this amount is negated from it when calcualting
		decay.momentumOnHaltLogFactor = 4; //the more it is, the less momentum will affect halting power
		decay.momentumOnHaltPowFactor = 0.5; //the less it is, the less momentum will affect halting power
		decay.wrinklerApproachFactor = 10; //the more it is, the slower wrinklers approach the big cookie with increased decay
		decay.wrinklerApproachPow = 0.25; //the less it is, the slower wrinklers approach the big cookie with increased decay
		decay.purityToRequiredHaltPow = 0.7; //purity is raised to this power when calculating its effect on required halt
		decay.accToRequiredHaltPow = 0.7; //acceleration is raised to this when calculating its power on required halt
		decay.accToRequiredHaltMinimum = 1.5; //minimum required for the effect to take place
		decay.accToRequiredHaltMaximum = 10; //maximum acceleration for the effect
		decay.wcPow = 1; //the more it is, the more likely golden cookies are gonna turn to wrath cokies with less decay
		decay.pastCapPow = 0.1; //the power applied to the number to divide the mult if going past purity cap with unshackled purity
		decay.bankedPurification = 0; //adds to mult and multiplies close 
		decay.hasExtraPurityCps = false; //whether has extra cps bonuses from purity that is outside of puritys gain itself
		decay.extraPurityCps = 1; //the actual thing (should have had this from the start but whatever)
        Game.cookiesInTermsOfCps = Game.cookies / Game.cookiesPs;
		decay.times = { //frames
			//not the most efficient possible but ah well, as long as I dont use this for too many things at once
			sinceLastPurify: 100, 
			sincePledgeEnd: 100,
			sinceLastAmplify: 200,
			sinceLastHalt: 100,
			sincePowerGain: 1000,
			sincePowerClick: 1000,
			sinceOrbClick: 1000,
			sinceSeason: 3000,
			sinceLastWork: 1000,
			sinceLastExhaustion: 10000,
			sinceExhaustionRecovery: 10000,
			sinceWrinklerSpawn: 10,
			sinceSoulClaim: 1000,
			sinceBomberSpawn: 10,
			sinceMomentumUnlock: 0,
			sinceGameLoad: 0,
			sinceVeilTurnOn: 10000,
			sinceVeilTurnOff: 10000,
			sinceLastCaramelClaim: 100000,
		};
		decay.buffDurPow = 0.5; //the more this is, the more that decay will affect buff duration
		decay.purifyMomentumMult = 2; //multiplied to the amount decrease; deprecated
		decay.haltReverseMomentumFactor = 0.985; //each point of halt called when decay.stop multiplies the momentum with this amount
		decay.haltSubtractMomentum = 1000000; //no clue what this does but just make it as large as possible tysm
		decay.cpsList = [];
		decay.multList = []; //gets processed every 3 ticks because its not very important
		decay.exemptBuffs = ['clot', 'building debuff', 'loan 1 interest', 'loan 2 interest', 'loan 3 interest', 'gifted out', 'haggler misery', 'pixie misery', 'stagnant body', 'unending flow', 'powerSurge', 'powerClick', 'coagulated', 'cursed', 'smited', 'distorted'];
		decay.gcBuffs = ['frenzy', 'click frenzy', 'dragonflight', 'dragon harvest', 'building buff', 'blood frenzy', 'cookie storm', 'mini frenzy'];
		decay.justMult = 0; //debugging use
		decay.infReached = false;
		decay.unlocked = false;
		decay.everUnlocked = false;
		decay.momentumUnlocked = false;
		decay.cpsDiff = 1;
		decay.acceleration = 1; //hoisting it up there to prevent funny issues
		decay.DEBUG = false; //disable or enable the debugger statements
		decay.hasEncounteredNotif = false;
		decay.prefs = {
			ascendOnInf: 1,
			wipeOnInf: 0,
			preventNotifs: { /*actually set later on*/ },
			widget: 1,
			particles: 1,
			scrollClick: 1,
			RunTimer: 0,
			LegacyTimer: 0,
			typingDisplay: 1,
			scrollWrinklers: 1,
			touchpad: 0,
			comp: 0,
			powerClickShiftReverse: 0,
			easyPurchases: 0,
			autoPause: 1,
			fatigueWarning: 1,
			bigSouls: 0,
			bigOrbs: 1,
			slowSouls: 0,
			slowOrbs: 0,
			difficultyRamping: 1,
			easyTyping: 1,
			scrollCDDisplay: 1,
			prestigeProgressDisplay: 1
		}
		Game.TCount = 0;

		//decay core
		decay.update = function(buildId, tickSpeed) { 
			if (Game.Has('Purity vaccines') || decay.takeABreak) { return decay.mults[buildId]; }
			if (buildId == decay.multsLastIndex) {
				const result = decay.getCpsDiffFromDecay();
				if ((result > 1 && decay.mults[buildId] <= 1) || (result < 1 && decay.mults[buildId] >= 1)) {
					decay.toResetWidget = true;
				}
				return result;
			}
			let c = decay.mults[buildId];
			if (Game.Has('Purification domes')) { tickSpeed *= decay.getBuildingSpecificTickspeed(buildId); }
    		c *= Math.max(Math.pow(Math.pow(1 - (1 - Math.pow(1 - decay.incMult, Math.max(1 - c, decay.min) * (1 / Game.fps))), (Math.max(1, Math.pow(c, decay.purityToDecayPow)))), tickSpeed * (1 - Math.min(decay.effectiveHalt / decay.requiredHalt, 1))), 0.1);
			return c;
		} 
		Game.log10Cookies = Math.log10(Game.cookiesEarned + 10);
		Game.log10CookiesSimulated = Game.log10Cookies;
		decay.updateAll = function() {
			if (!Game.OnAscend && !Game.AscendTimer) { Game.TCount++; }
			decay.updateProgressKeypoints();
			if (Game.cookiesEarned <= decay.featureUnlockThresholds.rate || window.isEE) { 
				decay.unlocked = false; return false; 
			} else { 
				if (!decay.unlocked) {
					decay.toResetWidget = true;
					decay.everUnlocked = true; 
					Game.Win('Unnatural resistance'); 
				}
				decay.unlocked = true; 
			}
			if (Game.cookiesEarned <= decay.featureUnlockThresholds.momentum) { decay.momentumUnlocked = false; } else if (!decay.momentumUnlocked) { decay.momentumUnlocked = true; decay.times.sinceMomentumUnlock = 0; Game.Win('Mass x velocity'); }
			if (decay.momentum < 1) { decay.momentum = 1; }
			if (decay.infReached) { decay.onInf(); decay.infReached = false; }
			if (!Game.OnAscend && !Game.AscendTimer) {
				const t = decay.getTickspeed();
				decay.rateTS = t;
				decay.purityToDecayPow = decay.getPurityToDecayPow();
				decay.purityToMomentumPow = decay.purityToDecayPow / 3;
				decay.effectiveHalt = decay.getEffectiveHalt();
                decay.requiredHalt = decay.getRequiredHalt();
				decay.updateBreaking();
				if (Game.Has('Purification domes')) {
					for (let i in decay.mults) {
						let c = decay.update(i, t);
						if (!Number.isFinite(1 / c)) { c = 1 / (Number.MAX_VALUE * 0.9999999999); if (!isNaN(c)) { decay.infReached = true; } }
						decay.mults[i] = c;
					}
				} else { 
					let c = decay.update(0, t);
					if (decay.mults[decay.multsLastIndex] <= 1 && c > 1 || decay.mults[decay.multsLastIndex] > 1 && c <= 1) { decay.toResetWidget = true; }
					if (!Number.isFinite(1 / c)) { c = 1 / (Number.MAX_VALUE * 0.9999999999); if (!isNaN(c)) { decay.infReached = true; } }
					for (let i in decay.mults) {
						decay.mults[i] = c;
					}
				}
				decay.recover();
				decay.updateFatigue();
				decay.updateFuse();
				if (decay.momentumUnlocked) { decay.momentum = decay.updateMomentum(decay.momentum); }
				Game.recalculateGains = 1; //uh oh
				decay.cpsList.push(Game.unbuffedCps);
				if (decay.cpsList.length > Game.fps * 1.5) {
					decay.cpsList.shift();
				}
				if (Game.T%3==0) { 
					decay.multList.push(decay.gen); 
					if (decay.multList.length > 100) {
						decay.multList.shift();
					}
				}
				if (decay.powerUnlocked()) { decay.updatePower(); }
				decay.updateWrinklers();
			}
			if (Game.pledgeT > 0) {
				let strength = Game.getPledgeStrength();
				decay.purifyAll(strength[0], strength[1], strength[2], true);
			}
			if (Game.pledgeC > 0) {
				Game.pledgeC--;
				if (Game.pledgeC == 0) {
					Game.Upgrades["Elder Pledge"].icon[0] = 9;
					Game.Upgrades["Elder Pledge"].icon[1] = 9;
					Game.Upgrades["Elder Pledge"].icon[2] = 'img/icons.png';
					Game.upgradesToRebuild = 1;
					Game.Lock('Elder Pledge');
					Game.Unlock('Elder Pledge');
					Game.Notify('Elder Pledge restored!', '', 0);
				}
			}
			if (decay.effectiveHalt > 3.6 && Game.Has('Purity bakery')) { decay.purifyAll(1 + 0.1 / Game.fps, 0.05 / Game.fps, 1); }
			if (decay.times.sinceLastPurify > Game.fps) { decay.bankedPurification += Game.auraMult('Fierce Hoarder') / (4 * Game.fps * Math.pow(1 + decay.bankedPurification, 0.5)); }
			decay.gen = decay.mults[20];
			decay.cpsDiff = decay.gen;
			Game.updateVeil();

			decay.updateFurnace();

			decay.updateBreaks();

			if (Game.T%6 == 0) { 
				decay.setWrinklersAll();
			}

			decay.updatePowerOrbs();
			decay.powerClickToLeftSectionSpeed = decay.setSymptomsFromPowerClicks();

			decay.updateCovenant();

			decay.updateTouchOfForce();

			if (decay.ascendIn) {
				decay.ascendIn--;
				if (decay.ascendIn == 0) { 
					Game.Ascend(1); 
				} else if (decay.ascendIn%Game.fps == 0) {
					Game.Notify(''+decay.ascendIn/Game.fps, '', 0, 2);
				}
				if (Game.keys[27]) { decay.ascendIn = 0; Game.Notify(loc('Ascending cancelled!'), '', 0); }
			}

			if (Game.ascensionMode == 42069) {
				decay.acceleration = Math.max(1, decay.acceleration + decay.updateAcc());
			}

            Game.cookiesInTermsOfCps = Game.cookies / Game.cookiesPs;
		}
		Game.registerHook('logic', decay.updateAll);
		Game.registerHook('logic', function() {
			for (let i in decay.times) {
				decay.times[i]++;
			}
		})
		decay.draw = function() {
			decay.updateWidget();
			if (decay.toResetWidget) {
				decay.setWidget();
				decay.toResetWidget = false;
			}
			decay.updateStats();
			decay.updateTypingDisplay();
			decay.updatePowerGauge();
		}
		decay.updateMomentum = function(m) {
			if (Game.Has('Purity vaccines') || decay.times.sinceMomentumUnlock < 10 * Game.fps) { return m; }

			decay.momentumTS = decay.getMomentumMult();
			m += 0.002 * decay.momentumTS / Math.pow(Math.min(m, 2), 2) / Game.fps;

			//let mult = decay.momentumTS * Math.pow(1 + decay.incMult, 5) * Math.pow(Math.max(decay.gen, 1), decay.purityToMomentumPow) / (16 * Game.fps);
			//m += ((Math.log((m + decay.momentumLogInc - 1)) / Math.log(decay.momentumLogInc)) * (1 - Math.min(1, decay.effectiveHalt / decay.TSMultFromMomentum)) / decay.momentumIncFactor) * mult; more wanky old nonsense
			
			return Math.max(1, m);
		}
		decay.getTickspeed = function() {
			let tickSpeed = 1;
			tickSpeed *= decay.broken;
			tickSpeed *= Math.pow(decay.shatterManifestation, 2);
			tickSpeed *= Game.eff('decayRate');
			tickSpeed *= 1 + 0.2 * Game.suckingCount;
			if (Game.resets < 1) {
				tickSpeed *= Math.max(decay.gen + 0.15, 1);
			}
			if (Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (decay.gen <= 1 && !Game.hasBuff('Coagulated')) {
				if (Game.Has('Rift to the beyond')) { tickSpeed *= 0.5; }
				if (decay.challengeStatus('dualcast') || decay.isConditional('dualcasat')) { tickSpeed *= 0.75; }
			}
			if (Game.hasGod) {
				let godLvl = Game.hasGod('asceticism');
				if (godLvl == 1) { tickSpeed *= 0.7; }
				else if (godLvl == 2) { tickSpeed *= 0.8; }
				else if (godLvl == 3) { tickSpeed *= 0.9; }
			}
			if (decay.covenantStatus('wrathBan') && decay.gen <= 1) { tickSpeed *= 0.3; }
			if (Game.hasBuff('Storm of creation').arg1) { tickSpeed *= 1 - Game.hasBuff('Storm of creation').arg1; }
			if (Game.hasBuff('Unending flow').arg1) { tickSpeed *= 1 - Game.hasBuff('Unending flow').arg1; }
			if (Game.hasBuff('Stagnant body').arg1) { tickSpeed *= 1 + Game.hasBuff('Stagnant body').arg1; }
			if (Game.Has('Santa\'s bottomless bag')) { tickSpeed *= 0.9; }
			//if (Game.ascensionMode==42069) { tickSpeed *= 0.5; }
			if (Game.Has('Lumpy evolution')) {
				let n = 0;
				for (let i in Game.Objects) { if (Game.Objects[i].level >= 10) { n++; } }
				tickSpeed *= (1 - n / 100);
			}
			if (decay.isConditional('typing')) { tickSpeed *= 0.15; }
			tickSpeed *= decay.acceleration;
			tickSpeed *= Math.pow(1.25, decay.NGMState);

			return tickSpeed;
		}
		decay.getTickspeedMultFromMomentum = function() {
			return Math.max(1, decay.momentum);
			//return 1 + (Math.max(Math.log2(decay.momentum * 2), 1) / Math.log2(decay.momentumFactor)) * (1 - 1 / Math.pow(decay.momentum, decay.smoothMomentumFactor)); wanky old stuff
		}
		decay.getMomentumMult = function() {
			//getTickspeed but for momentum
			let tickSpeed = Math.max(1 + decay.incMult - 0.12, 1);
			tickSpeed *= decay.broken;
			tickSpeed *= Math.pow(decay.shatterManifestation, 0.5);
			tickSpeed *= (1 - Math.pow(0.75, Math.log10(Math.max(Game.cookiesEarned - decay.featureUnlockThresholds.momentum, 1))));
			tickSpeed *= Game.eff('decayMomentum');
			if (Game.hasGod) {
				let godLvl = Game.hasGod('asceticism');
				if (godLvl == 1) { tickSpeed *= 0.7; }
				else if (godLvl == 2) { tickSpeed *= 0.8; }
				else if (godLvl == 3) { tickSpeed *= 0.9; }
			}
			//tickSpeed *= Math.pow(2, Math.max(0, Game.gcBuffCount() - 1));
			if (Game.hasBuff('Storm of creation').arg1) { tickSpeed *= 1 - Game.hasBuff('Storm of creation').arg1; }
			if (Game.hasBuff('Unending flow').arg1) { tickSpeed *= 1 - Game.hasBuff('Unending flow').arg1; }
			if (Game.hasBuff('Stagnant body').arg1) { tickSpeed *= 1 + Game.hasBuff('Stagnant body').arg1; }
			if (Game.Has('Market manipulator')) { tickSpeed *= 0.95; }
			//if (Game.ascensionMode==42069) { tickSpeed *= 0.5; }
			if (decay.ascendIn) { tickspeed *= 2; }
			if (Game.Has('Lumpy evolution')) {
				let n = 0;
				for (let i in Game.Objects) { if (Game.Objects[i].level >= 10) { n++; } }
				tickSpeed *= (1 - n / 100);
			}
			if (decay.isConditional('typing')) { tickSpeed *= 0.15; }
			tickSpeed *= decay.acceleration;
			tickSpeed *= Math.pow(1.1, decay.NGMState);
			
			return tickSpeed;
		}
		decay.getPurityToDecayPow = function() {
			let base = 2;
			//base += 0.25 * Math.max(0, Game.gcBuffCount() - 1);
			if (Game.Has('Unshackled Purity')) { base *= decay.unshackledPurityMult; }
			if (Game.Has('Stabilizing crystal')) { base *= 0.9; }
			return base;
		}
		decay.getBuildingSpecificTickspeed = function(buildId) {
			let tickSpeed = 1;
			if (Game.ObjectsById[buildId].tieredUpgrades.purity.bought) { tickSpeed *= 1 - decay.purityTierStrengthMap[buildId]; }
			if (Game.Has('Ultra-concentrated sweetener')) { tickSpeed *= 1 - 0.02 * Math.min(Game.ObjectsById[buildId].level, 20); }
			
			return tickSpeed;
		}
		decay.purify = function(buildId, mult, close, cap, uncapped, fromAll) {
			if (!decay.unlocked) { return false; }
			if (buildId == 20) { decay.mults[20] = decay.getCpsDiffFromDecay(); return; }
			if (!fromAll) { mult *= decay.getPurificationMult(); uncapped = Game.Has('Unshackled Purity'); }
			decay.times.sinceLastPurify = 0;
			if (decay.mults[buildId] >= cap) { 
				if (!uncapped) { return false; } else {
					mult = 1 + (mult - 1) / Math.pow(decay.mults[buildId] / cap, decay.pastCapPow);
				}
			}
			decay.toResetWidget = true;
			if (uncapped && decay.mults[buildId] * mult >= cap && !(decay.mults[buildId] >= cap)) {
				mult /= cap / decay.mults[buildId];
				decay.mults[buildId] = cap;
				mult = 1 + (mult - 1) / Math.pow(decay.mults[buildId] / cap, decay.pastCapPow);
			}
			decay.mults[buildId] *= mult;
			if (decay.mults[buildId] >= cap && !uncapped) { 
				decay.mults[buildId] = cap; return true; 	
			}
			if (decay.mults[buildId] < 1) { 
				decay.mults[buildId] *= Math.pow(10, -Math.log10(decay.mults[buildId]) * close);
			}
			if (decay.mults[buildId] > cap && !uncapped) { decay.mults[buildId] = cap; }
		}
		decay.purifyAll = function(mult, close, cap, invisPurify) {
			if (typeof id === 'undefined') { id = ''; }
			mult *= decay.getPurificationMult();
			let u = false;
			if (Game.Has('Unshackled Purity')) { u = true; }
			if (Game.Has('Purity factory')) { cap *= 1.5; }
			const bp = ((Game.auraMult('Fierce Hoarder')>0)?decay.bankedPurification:0);
			for (let i in decay.mults) {
				if (decay.purify(i, mult + bp, 1 - Math.pow(1 / (1 + bp), 0.5) * (1 - close), cap * (1 + bp / 5), u, true)) { decay.triggerNotif('purityCap'); }
			}
			if (bp) { decay.bankedPurification *= 0.5; }
			if (Game.hasGod) {
				let godLvl = Game.hasGod('creation');
				if (godLvl == 1) {
					Game.gainBuff('creation storm', 9, 0.48);
				} else if (godLvl == 2) {
					Game.gainBuff('creation storm', 27, 0.24);
				} else if (godLvl == 3) {
					Game.gainBuff('creation storm', 81, 0.12);
				}
			}

			if (!invisPurify) {
				let color = colorCycleFrame([51, 255, 68], [20, 255, 193], close);
				Crumbs.spawn(decay.soulClaimAuraTemplate, {
					expandSpeed: 50 * (1 + mult) / Game.fps,
					expandFriction: Math.pow(0.8, 1 / Math.sqrt(mult + 1)),
					thinningSpeed: 1 / Game.fps,
					thinningAcceleration: (0.3 / Math.pow(mult + 1, 0.2)) / Game.fps,
					currentWidth: 2 + 4 * mult,
					color: 'rgb('+color[0]+','+color[1]+','+color[2]+')'
				});
				Game.BigCookieState = 2;
				decay.bounceBackIn = 0.4 * Game.fps;
			}	

			if (Game.Has('Cherubim')) { decay.gainPower(2 * Math.pow(Math.max(Math.min(mult, 10) - 1, 0), 2), Crumbs.scopedCanvas.left.width * 0.5, Crumbs.scopedCanvas.left.height * 0.4, 0, 0, 1200); }
		}
		decay.getPurificationMult = function() {
			let mult = 1;
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { mult *= 3; }
			return mult;
		}
		decay.refresh = function(buildId, to) { 
   			decay.mults[buildId] = Math.max(to, decay.mults[buildId]);
		}
		decay.refreshAll = function(to) {
			for (let i in decay.mults) {
				decay.refresh(i, to);
			}
			decay.momentum = 1;
			decay.times.sinceLastPurify = 0;
			Game.recalculateGains = 1;
		}
		decay.resetAll = function(to) {
			for (let i in decay.mults) {
				decay.mults[i] = to;
			}
		}
		decay.haltChannel = function(obj) {
			this.decMult = 1; //multiplier to decrease
			this.overtimeLimit = 10000; 
			this.factor = 0.2; //more = faster that decay recovers from decreasing effective halt
			this.keep = 0.35; //fraction of halt each stop kept as overtime
			this.tickspeedPow = 0.25; //represents the amount that the current tickspeed affects its effectiveness, more = more effect
			this.overtimeDec = 0.25; //fraction of normal decHalt applied to overtime when normal halt is in effect
			this.overtimeEfficiency = 0.25; //overtime multiplier
			this.power = 1; //the amount of effective halt that "1" is equivalent to
			this.haltMax = 1; //power but more finnicky, the upper cap of halt

			this.autoExpire = false; //automatically delete itself from the channel upon reaching 0 halt and 0 overtime
			this.group = null;

			this.halt = 0;
			this.overtime = 0;
			
			for (let i in obj) {
				this[i] = obj[i];
			}
		}
		decay.haltChannel.prototype.addHalt = function(val) {
			this.halt = Math.max(this.halt, val);
			this.overtime = Math.min(this.overtimeLimit * Game.eff('haltPower'), this.overtime + this.halt * this.keep); 
		}
		decay.haltChannel.prototype.recover = function(mult) {
			const decHalt = decay.decHalt * Math.pow(Math.max(decay.rateTS / Math.pow(decay.acceleration, 0.75), 1), this.tickspeedPow) * this.decMult / Game.fps;
			this.halt = Math.max(0, this.halt - decHalt);
			if (this.halt == 0) {
				this.overtime = Math.max(0, this.overtime - decHalt);
			} else {
				this.overtime = Math.max(0, this.overtime - decHalt * this.overtimeDec);
			}
		}
		decay.haltChannel.prototype.getEffectiveHalt = function() {
			return Math.min(Math.pow(this.halt + this.overtime * this.overtimeEfficiency, this.factor), this.haltMax) * (typeof this.power === 'function'?this.power():this.power);
		}
		decay.halts['click'] = new decay.haltChannel({
			properName: loc('Click'),
			overtimeLimit: 18,
			power: function() {
				return 1 + Game.Has('Purity stand') * 0.1;
			},
			recover: function() {
				let decHalt = decay.decHalt * Math.pow(Math.max(decay.rateTS / decay.acceleration, 1), this.tickspeedPow) * this.decMult / Game.fps;
				if (Date.now() - Game.lastClick < 150 && (!decay.exhaustion || Game.veilOn())) { decHalt *= 0.2; }
				this.halt = Math.max(0, this.halt - decHalt);
				if (this.halt == 0) {
					this.overtime = Math.max(0, this.overtime - decHalt);
				} else {
					this.overtime = Math.max(0, this.overtime - decHalt * this.overtimeDec);
				}
			}
		});
		Crumbs.fallingCookieOnclick = function() {
			if (Game.prefs.particles) { Crumbs.spawnFallingCookie(0, -64, 0, 0, 2, 'fallingCookie', false, 1, 0); }
			Crumbs.spawnFallingCookie(0, 0, Math.random()*-2-2, Math.random()*4-2, 1, 'clickedCookie', true, Math.pow(decay.halts.click.overtime / decay.halts.click.overtimeLimit, 1) * 1.25 * (Math.random() * 0.2 + 0.9), 20);
		}
		eval('Crumbs.spawnFallingCookie='+Crumbs.spawnFallingCookie.toString().replace(' || !Game.prefs.particles', ' || (!Game.prefs.particles && id != "clickedCookie")'));
		decay.halts['others'] = new decay.haltChannel({
			properName: loc('others'),
			keep: 0, //no overtime
			tickspeedPow: 0
		});
		decay.haltChannelGroup = function(properName) {
			this.channels = [];
			if (properName) { this.properName = properName; }
			//for (let i in arguments) { this.addChannel(arguments[i]); }
		}
		decay.haltChannelGroup.prototype.addChannel = function(channel) {
			channel.group = this;
			this.channels.push(channel);
		}
		decay.haltChannelGroup.prototype.removeChannel = function(input) {
			if (typeof input === 'number') { this.channels.splice(input, 1); }
			if (input instanceof decay.haltChannel) { this.channels.splice(this.channels.indexOf(input), 1); }
		}
		decay.haltChannelGroup.prototype.recover = function() {
			for (let i of this.channels) { 
				i.recover();
				if (i.autoExpire && i.halt <= 0 && i.overtime <= 0) { this.removeChannel(i); }
			}
		}
		decay.haltChannelGroup.prototype.getEffectiveHalt = function() {
			let halt = 0;
			for (let i of this.channels) { halt += i.getEffectiveHalt(); }
			return halt;
		}
		decay.stop = function(val, channel) {
			if (!decay.unlocked) { return; }
			val *= decay.getHaltMult();			
			if (!channel) { channel = 'others'; }
			decay.halts[channel].addHalt(val);
			//decay.momentum = 1 + (decay.momentum - 1) * Math.pow(decay.haltReverseMomentumFactor, Math.log2(Math.max(val * 2, 2)));
			//decay.momentum -= Math.log2(Math.max(val * 2, 2)) / decay.haltSubtractMomentum;
			if (decay.momentum < 1) { decay.momentum = 1; }
			decay.times.sinceLastHalt = 0;
		}
		decay.recover = function() { 
			for (let i in decay.halts) {
				decay.halts[i].recover();
			}
		}
		decay.getHaltMult = function() {
			let mult = 1;
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { mult *= 5; }
			mult *= Game.eff('haltPower');
			return mult;
		}
		decay.getEffectiveHalt = function() {
			//gets the effective halting power 
			let halt = 0;
			for (let i in decay.halts) {
				halt += decay.halts[i].getEffectiveHalt();
			}
			let mult = 1;
			if (decay.isConditional('earthShatterer')) { mult *= 1.05; }
			return halt * mult;// / (Math.pow(1 + Math.log(Math.max(1, decay.momentum - decay.momentumOnHaltBuffer)) / Math.log(decay.momentumOnHaltLogFactor), decay.momentumOnHaltPowFactor));
		}
        decay.getRequiredHalt = function() {
            let r = 1;
			if (decay.isConditional('godz')) { r *= (1 + Game.BuildingsOwned * 0.001); }
			r *= decay.shatterManifestation;
            if (decay.gen > 1) { r *= Math.pow(decay.gen, decay.purityToRequiredHaltPow); }
            if (decay.momentumUnlocked) { 
				decay.TSMultFromMomentum = decay.getTickspeedMultFromMomentum();
				r *= decay.TSMultFromMomentum; 
			}
            if (Game.hasBuff('Coagulated')) { r *= 1.5; }
            if (Game.hasBuff('Cursed')) { r *= 3; }
			r *= Math.pow(1.15, decay.NGMState);
			r *= Math.pow(Math.min(Math.max(decay.acceleration / decay.accToRequiredHaltMinimum, 1), decay.accToRequiredHaltMaximum), decay.accToRequiredHaltPow);
			if (decay.acceleration > decay.accToRequiredHaltMinimum) { decay.triggerNotif('accExtras'); }

			r += Game.suckingCount;
            
            return r;
        }
		decay.wipeAllHalts = function() {
			for (let i in decay.halts) {
				if (decay.halts[i].channels) { decay.halts[i].channels = []; continue; }

				decay.halts[i].halt = 0;
				decay.halts[i].overtime = 0;
			}
		}
		decay.saveHaltValues = function() {
			let str = '';
			for (let i in decay.halts) {
				if (!(decay.halts[i].halt || decay.halts[i].overtime) && !decay.halts[i].channels) { continue; }
				if (decay.halts[i].channels) {
					if (!decay.halts[i].channels.length) { continue; }
					str += 'CHANNELGROUP#' + i;
					for (let ii in decay.halts[i].channels) {
						str += '#' + decay.halts[i].channels[ii].halt + 'Z' + decay.halts[i].channels[ii].overtime; 
					}
					str += ',';
					continue;
				}
				str += i + '#' + decay.halts[i].halt + '#' + decay.halts[i].overtime + ',';
			}
			if (!str) { return str; }
			str = str.slice(0, str.length - 1);
			return str;
		}
		decay.loadHaltValues = function(str) {
			if (!str) { return; }
			str = str.split(',');
			for (let i in str) {
				const v = str[i].split('#');
				if (!isv(v[0]) || v.includes('-')) { continue; }
				if (v[0] == 'CHANNELGROUP') {
					continue; //cant be bothered damnit
					let name = v[1];
					for (let ii = 2; ii < v.length; i++) {
						if (isv(v[1])) { decay.halts[v[0]].halt = parseFloat(v[1]); }
					}
					continue;
				}
				if (isv(v[1])) { decay.halts[v[0]].halt = parseFloat(v[1]); }
				if (isv(v[2])) { decay.halts[v[0]].overtime = parseFloat(v[2]); }
			}
		}
		decay.amplify = function(buildId, mult, anticlose) {
			if (buildId == 20) { decay.mults[20] = decay.getCpsDiffFromDecay(); return; }
			if (!decay.unlocked) { return false; }
			decay.mults[buildId] *= Math.pow(10, -Math.abs(Math.log10(decay.mults[buildId]) * anticlose));
			decay.mults[buildId] *= 1 / mult;
			decay.times.sinceLastAmplify = 0;
			if (isNaN(decay.mults[buildId]) || !decay.mults[buildId]) { decay.mults[buildId] = 1 / Number.MAX_VALUE; }
		}
		decay.amplifyAll = function(mult, anticlose) {
			for (let i in decay.mults) {
				decay.amplify(i, mult, anticlose);
			}
		}
		addLoc('Fatigue warning (%1%)');
		decay.warningThresholds = [0.5, 0.8, 0.9, 0.95, 0.98, 0.99];
		decay.work = function(amount) {
			//working increases fatigue
			if (Game.cookiesEarned < decay.featureUnlockThresholds.fatigue || decay.exhaustion || Game.hasBuff('Power poked')) { return; }
			if (!amount) { amount = 0; }
			if (decay.prefs.fatigueWarning) {
				const prev = decay.fatigue / decay.fatigueMax;
				const post = (decay.fatigue + amount) / decay.fatigueMax;
				for (let i in decay.warningThresholds) {
					if (prev < decay.warningThresholds[i] && post >= decay.warningThresholds[i]) { Game.Notify(loc('Fatigue warning (%1%)', Beautify(decay.warningThresholds[i] * 100)), '', 0, 6); }
				}
			}
			decay.fatigue += amount;
			if (decay.fatigue >= decay.fatigueMax && !decay.exhaustion) { decay.fatigue = 0; decay.exhaust(); }
			decay.times.sinceLastWork = 0;
		}
		addLoc('Exhausted! (%1s)');
		decay.timesExhausted = 0;
		decay.timesExhaustedLocal = 0;
		decay.exhaust = function() {
			decay.exhaustion = decay.exhaustionBegin * decay.exhaustionBeginMult * (decay.timesExhaustedLocal < 1?0.5:1) * (decay.challengeStatus('dualcast')?0.85:1);
			decay.fatigue = 0;
			Game.Notify(loc('Exhausted! (%1s)', Beautify(decay.exhaustion / Game.fps)), '', 0);
			decay.timesExhausted++;
			decay.timesExhaustedLocal++;
			decay.triggerNotif('fatigue');
		}
		decay.updateFatigue = function() {
			if (decay.exhaustion && !Game.veilOn()) { 
				decay.exhaustion--; 
				if (decay.exhaustion <= 0) { 
					decay.exhaustion = 0; 
					decay.times.sinceExhaustionRecovery = 0; 
					Game.Notify('Refreshed!', '', 0); 
					decay.onExhaustionRecovery();
				}
			}
		}
		decay.onExhaustionRecovery = function() {
			if (Game.Has('Rebound boost')) { Game.gainBuff('reboundBoost', 30); }
			if (Game.Has('Counter strike')) { Game.gainBuff('counterStrike', 30); }
			if (Game.Has('Withering shock')) { 
				const allWrinklers = Crumbs.getObjects('w');
				for (let i in allWrinklers) {
					allWrinklers[i].hurt += 200;
					allWrinklers[i].damageMult *= 1.5;
				}
				Crumbs.spawnVisible(Crumbs.cookieClickPopup, {
					'x': Crumbs.scopedCanvas.left.l.offsetWidth * 0.5,
					'y': Crumbs.scopedCanvas.left.l.offsetWidth * 0.4,
					components: [new Crumbs.component.text({
						size: 24,
						color: 'rgb(255, 237, 123)',
						align: 'center',
						content: loc('wrinkler damage x%1!', Beautify(1.5, 2))
					})]
				});
			}
			if (Game.Has('Back in a flash') && decay.thunderMarkerObj.enabled) {
				let o = {
					delay: 1 * Game.fps,
					speed: 24 / Game.fps,
					radius: 200,
					speedDecMult: 0.1,
					alphaDecreaseRate: 0.4 / Game.fps,
					x: decay.thunderMarkerObj.x,
					y: decay.thunderMarkerObj.y,
					isFromPC: false,
					trigger: true,
					rotation: Math.random() * Math.PI,
					imgUsing: Math.round(Math.random()),
					damage: 100 * 1.5 * (1 + Game.Has('Pulsatic discharge') * 2 / 3)
				}
				Crumbs.spawn(decay.shockwaveTemplate, o);
				o.imgUsing = Math.round(Math.random());
				o.rotation = Math.random() * Math.PI;
				o.delay = 1.25 * Game.fps;
				Crumbs.spawn(decay.shockwaveTemplate, o);
			}
		}
		addLoc('Times exhausted:');
		addLoc('Exhaustion time remaining:'); addLoc('paused');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`wrathStr+'</div>':'')+`, `wrathStr+'</div>':'')+(decay.exhaustion?('<div class="listing"><b>'+loc("Exhaustion time remaining:")+'</b> '+Game.sayTime(decay.exhaustion, -1)+(Game.veilOn()?(' '+loc('(paused)')):'')+'</div>'):'')+(decay.timesExhausted?('<div class="listing"><b>'+loc("Times exhausted:")+'</b> '+Beautify(decay.timesExhaustedLocal)+' <small>('+loc('all time: ')+Beautify(decay.timesExhausted)+')</small></div>'):'')+`));
		decay.symptomsFromFatigue = function(source) {
			//source: 0 is speed, 1 is opacity
			if ((kaizoCookies.paused && !source) || decay.times.sinceGameLoad == 0) { return 0; }
			const f = Game.veilOn()?(1 - Math.min(decay.times.sinceVeilTurnOn / Game.fps / 2 + (1 - Math.max(decay.fatigue / decay.fatigueMax, decay.exhaustion?1:0)), 1))
			:((Math.min(decay.times.sinceVeilTurnOff / 2 / Game.fps, 1)) * Math.max(decay.fatigue / decay.fatigueMax, decay.exhaustion?1:0));
			return Math.pow(1 - f, 0.75) * (Math.min(decay.times.sinceExhaustionRecovery, 2 * Game.fps) / 2 / Game.fps);
		}
		Game.buffCount = function() {
			let count = 0;
			for (let i in Game.buffs) { if (!decay.exemptBuffs.includes(Game.buffs[i].type.name)) { count++; } }
			return count;
		}
		Game.gcBuffCount = function() {
			let count = 0;
			for (let i in Game.buffs) { if (decay.gcBuffs.includes(Game.buffs[i].type.name)) { count++; } }
			return count;
		}
		decay.leftSectionSpeed = function(source) { return Math.pow(decay.symptomsFromFatigue(source), (decay.powerPokedStack>0?0.2:1)) * decay.powerClickToLeftSectionSpeed * (1 + Math.pow(Math.max(2.5 - Game.TCount / Game.fps, 0), 1) * 3) * (1 + Game.gcBuffCount() * 0.2); }
		Game.milkX = 0;
		Game.showerY = 0;
		Game.cursorR = 0;
		Game.cursorConverge = 0;
		Game.cursorClickCD = 0;
		/*eval('Game.DrawBackground='+Game.DrawBackground.toString().replace('ctx.globalAlpha=0.5*alphaMult;', 'ctx.globalAlpha=decay.symptomsFromFatigue(1)*0.5*alphaMult;')
			 .replace('ctx.globalAlpha=0.5;', 'ctx.globalAlpha=decay.symptomsFromFatigue(1)*0.5;')
			 .replace('ctx.globalAlpha=0.25', 'ctx.globalAlpha=decay.symptomsFromFatigue(1)*0.25')
			 .replace('var x=Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);', 'Game.milkX += 3 * decay.symptomsFromFatigue(); if (Game.milkX >= 480) { Game.milkX -= 480; } var x = Math.floor(Game.milkX) - (Game.milkH - Game.milkHd) * 2000 + 480*2;')
			 .replace('var y=(Math.floor(Game.T*2)%512);', 'Game.showerY += 3 * decay.symptomsFromFatigue(); if (Game.showerY >= 512) { Game.showerY = 0; } var y=Game.showerY;')
			 .replace('//var spe=-1;', 'let fatigue = decay.symptomsFromFatigue(); Game.cursorR += 0.15 * fatigue; Game.cursorClickCD += 0.0375 * fatigue; Game.cursorConverge += 0.015 * fatigue;')
			 .replace('if (i==0 && fancy) rot-=Game.T*0.1;', 'if (i==0 && fancy) rot-=Game.cursorR;')
			 .replace('if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;', 'if (fancy) w+=Math.sin((n+Game.cursorConverge)*Math.PI/2)*4;')
			 .replace('if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));', 'if (fancy) { w=(Math.sin(Game.cursorClickCD+(((i+n*12)%25)/25)*Math.PI*2)); }')
			 .replace('//shiny border during frenzies etc', `if (decay.exhaustion > 0 || decay.times.sinceExhaustionRecovery < 60) { ctx.globalAlpha = 1 - decay.symptomsFromFatigue(); ctx.drawImage(Pic('shadedBorders.png'),0,0,ctx.canvas.width,ctx.canvas.height); ctx.globalAlpha = 1; }`)
			);*/
		Crumbs.objectBehaviors.milkBehavior.replace('height - y;', 'height - y; Game.milkX += 3 * decay.leftSectionSpeed(); if (Game.milkX >= 480) { Game.milkX -= 480; }').replace('Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480)', 'Math.floor(Game.milkX) - (Game.milkH - Game.milkHd) * 2000 + 480*2;');
		Crumbs.objectBehaviors.cookieShowerBackground.replace('if (Game.cookiesPs', 'Game.showerY += 3 * decay.leftSectionSpeed(); if (Game.cookiesPs').replace('(Math.floor(Game.T*2)%512)', 'Game.showerY');
		Crumbs.objectBehaviors.shine1.replace('this.alpha = 0.5 * alphaMult', 'this.alpha = 0.5 * alphaMult * Math.min(decay.leftSectionSpeed(1), ((goodBuff)?2:1))');
		Crumbs.objectBehaviors.shine2.replace('this.alpha = 0.25 * alphaMult', 'this.alpha = 0.25 * alphaMult * Math.min(decay.leftSectionSpeed(1), ((goodBuff?4:2)))');
		eval('Crumbs.cursorDraw='+Crumbs.cursorDraw.toString().replace('ctx.save();', 'let fatigue = decay.leftSectionSpeed(); Game.cursorR += 0.15 * fatigue; Game.cursorClickCD += 0.0375 * fatigue; Game.cursorConverge += 0.015 * fatigue; ctx.save();')
			 .replace('if (i==0 && fancy) rot-=Game.T*0.1;', 'if (i==0 && fancy) rot-=Game.cursorR;')
			 .replace('if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;', 'if (fancy) w+=Math.sin((n+Game.cursorConverge)*Math.PI/2)*4;')
			 .replace('if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));', 'if (fancy) { w=(Math.sin(Game.cursorClickCD+(((i+n*12)%25)/25)*Math.PI*2)); }')
		);
		Crumbs.findObject('cursors').getComponent('canvasManipulator').function = Crumbs.cursorDraw;
		Crumbs.spawn({
			imgs: 'shadedBorders.png',
			id: 'shadedBordersStrong',
			scope: 'left',
			anchor: 'top-left',
			alpha: 0,
			order: 20,
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fillWhole),
				new Crumbs.behaviorInstance(function() { this.alpha = Math.max(1 / (1 + decay.leftSectionSpeed() * 3) - 0.1, 0); })
			]
		});
		eval('Crumbs.spawnCookieShower='+Crumbs.spawnCookieShower.toString().replace('Game.prefs.particles', 'Math.random() < decay.leftSectionSpeed() && Game.prefs.particles'));
		eval('Crumbs.fallingCookieOnclick='+Crumbs.fallingCookieOnclick.toString().replace('Crumbs.spawn(', 'if (Math.random() < decay.leftSectionSpeed()) Crumbs.spawn('));
		decay.breakingPointMap = {
			0: 0.1,
			max: 0
		}
		decay.updateBreaking = function() { 
			if (!Game.Has('Legacy') && decay.NGMState == 0) { return; }
			decay.breakingPoint = decay.breakingPointMap[decay.NGMState];
			if (decay.NGMState > decay.breakingPointMap.max) { decay.breakingPoint = decay.breakingPointMap[decay.breakingPointMap.max]; }
			if (decay.gen <= decay.breakingPoint) { 
				decay.broken = Math.max(decay.brokenMult * (-Math.log10(decay.gen) * 2 - 1), 1.01);
			} else { decay.broken = 1; }
		}
 		decay.get = function(buildId) {
			return decay.mults[buildId];
		}
		decay.takeABreak = 0; //I dont even
		decay.applyBreaks = function(amount) {
			decay.takeABreak = Math.max(decay.takeABreak, amount);
		}
		decay.updateBreaks = function() {
			if (decay.takeABreak > 0) {
				decay.takeABreak--;
			}
		}
		addLoc('Infinite decay');
		addLoc('Your game was wiped due to infinite decay!');
		addLoc('Excess decay caused a forced ascension without gaining any prestige or heavenly chips.');
		addLoc('Game automatically paused'); addLoc('Go to the options menu or use the hotkey (Shift + P or Shift + C) to toggle pausing.');
		addLoc('You have just reached infinite decay, which would have caused a forced ascension with no heavenly chips gained, effectively wiping all progress made in this run.<div class="line"></div>Luckily, reaching infinite decay for the first time earned you an achievement that purified all of your decay, giving you another chance. Use it well!');
		decay.onInf = function() {
			if (!Game.HasAchiev('Ultimate death')) { 
				Game.Win('Ultimate death'); 
				decay.resetAll(1);
				decay.applyBreaks(1 * Game.fps);
				Game.Prompt('<id infDecay><h3>'+loc('Infinite decay')+'</h3><div class="block" style="padding: 8px;"><b>'+loc('Game automatically paused')+'</b></div><div class="block">'+loc('You have just reached infinite decay, which would have caused a forced ascension with no heavenly chips gained, effectively wiping all progress made in this run.<div class="line"></div>Luckily, reaching infinite decay for the first time earned you an achievement that purified all of your decay, giving you another chance. Use it well!')+'</div>', [loc('Ok!')]);
				kaizoCookies.pauseGame();
				return;
			}
			if (decay.prefs.wipeOnInf && Game.ascensionMode != 42069) { Game.HardReset(2); Game.Notify(loc('Infinite decay'), loc('Your game was wiped due to infinite decay!'), [21, 25], Game.fps * 3600 * 24 * 365, false, 1); decay.setRates(); return; }
			if (decay.prefs.ascendOnInf || Game.ascensionMode == 42069) { decay.forceAscend(true); Game.Notify(loc('Infinite decay'), loc('Excess decay caused a forced ascension without gaining any prestige or heavenly chips.'), [21, 25], Game.fps * 3600 * 24 * 365, false, 1); decay.resetAll(1); }
		}
		decay.forceAscend = function(wipePrestige) {
			if (wipePrestige) { Game.cookiesEarned = 0; }
			if (!Game.OnAscend && !Game.AscendTimer) { Game.Ascend(1); } else { console.trace(); }
		}
		decay.autoPauseGame = function() {
			Game.Notify(loc('Game automatically paused') + '<br><div style="margin-top: 2px;"><small style="font-weight: normal; margin-top: 5px;">' + loc('Go to the options menu or use the hotkey (Shift + P or Shift + C) to toggle pausing.') + '</small></div>', '', 0); kaizoCookies.pauseGame();
		}
		//these are set at the reincarnate hooked decay function
		decay.unlockThresholds = {
			normal: {
				rate: 5555,
				wrinklers: 555555,
				fatigue: 5.555e12,
				shiny: 555555555,
				bomberNat: 5.555e24,
				momentum: 5.555e100, //5.555e33,
				fuse: 5.555e100, //5.555e42,
				phantom: 5.555e35,
				armored: 5.555e100, //5.555e45,
				leading: 5.555e100,
			},
			unshackled: {
				rate: 555,
				wrinklers: 5555,
				fatigue: 55555,
				shiny: 55555555,
				bomberNat: 5.555e24,
				momentum: 5.555e100, //5.555e33,
				fuse: 5.555e100, //5.555e42,
				phantom: 5.555e35,
				armored: 5.555e100, //5.555e45,
				leading: 5.555e100,
			}
		};
		decay.featureUnlockThresholds = decay.unlockThresholds.normal;
		decay.assignThreshold = function() {
			if (Game.ascensionMode == 42069) {
				decay.featureUnlockThresholds = decay.unlockThresholds.unshackled;
			} else {
				decay.featureUnlockThresholds = decay.unlockThresholds.normal;
			}
		};
		if (Game.cookiesEarned > decay.featureUnlockThresholds.rate) { decay.unlocked = true; }
		if (Game.cookiesEarned > decay.featureUnlockThresholds.momentum) { decay.momentumUnlocked = true; }
		//unshackled decay stuff is at the challenge mode section
		decay.wipeSave = function() {
			decay.unlocked = false;
			decay.everUnlocked = false; 

			for (let i in decay.mults) {
				decay.mults[i] = 1;
			}
			decay.halt = 0;
			decay.haltOvertime = 0;
			decay.momentum = 1;
			for (let i in decay.times) { decay.times[i] = 1000; }
			decay.cpsList = [];
			decay.multList = [];
			decay.bankedPurification = 0;
			decay.incMult = 0.001;
			decay.power = 0;
			for (let i in decay.challenges) {
				if (decay.challenges[i].reset) { decay.challenges[i].reset(); }
				decay.challenges[i].wipe();
			}
			decay.getCompletionCount();
			decay.currentConditional = null;
			decay.killAllPowerOrbs();
			for (let i in decay.gameCan) { decay.gameCan[i] = true; }
			Game.pledgeT = 0;
			Game.pledgeC = 0;
			Game.veilPreviouslyCollapsed = false;
			Game.setVeilMaxHP(); Game.veilHP = Game.veilMaxHP;
			decay.resetSW(); decay.wipeSW(); decay.createDefaultSWCodes();

			for (let i in Game.Upgrades) {
				if (Game.Upgrades[i].everBought) { Game.Upgrades[i].everBought = false; }
			}

			Game.cookieClicksGlobal = 0;
			decay.gamePausedCount = 0;

			for (let i in Game.EnchantedPermanentUpgrades) { Game.EnchantedPermanentUpgrades[i] = -1; }

			Game.ascensionMode = 0;
			decay.assignThreshold();
			decay.acceleration = 1;
			decay.highestReachedChallenged = 0;

			decay.wipeFurnace();

			decay.onAscending();

			decay.resetScrolls();

			l('clickHaltDisplayContainer').style.display = 'none';

			decay.hasEncounteredNotif = false;
			for (let i in decay.prefs.preventNotifs) {
				decay.prefs.preventNotifs[i] = false;
			}

			decay.NGMState = 0;
			decay.NGMResets = 0;
			decay.cookiesTotalNGM = 0;
			decay.goldenClicksTotalNGM = 0;
			decay.trueStartDate = Date.now();
			decay.cookieClicksTotalNGM = 0;
			decay.lumpsTotalNGM = 0;
			decay.spellsCastTotalNGM = 0;
			decay.harvestsTotalNGM = 0;

			decay.timesExhausted = 0;

			kaizoCookies.lastPause = 0;

			for (let i in Game.Objects) {
				Game.Objects[i].everUnlocked = false;
			}
			decay.checkBuildingEverUnlocks();

			decay.soulClaimCount = 0;
			decay.shinySoulClaimCount = 0;
			decay.bombersPopped = 0;
			decay.phantomEssenceUseCount = 0;
			decay.wipeUtenglobe();

			Game.Lock('Touch of force');
			Game.Lock('Touch of force [ACTIVE]');
			Game.Upgrades['Touch of force [ACTIVE]'].bought = 1;
			Game.Lock('Boundless sack');
			decay.thunderMarkerObj.enabled = false;

			for (let i in decay.seFrees) { decay.seFrees[i] = 0; }
			decay.resetBuildingLevelMinimums();
			

			grimoireUpdated = false; gardenUpdated = false; pantheonUpdated = false; stockUpdated = false;
			kaizoCookies.reworkMinigames();
			kaizoCookies.wipeMinigames();
		}
		decay.onAscending = function() {
			decay.setWrinklersAll();
			decay.halts['click'].halt = 1;

			decay.wipeAllHalts();

			Game.pledgeC = 0;
			Game.pledgeT = 0;
			Game.Upgrades["Elder Pledge"].icon[0] = 9;
			Game.Upgrades["Elder Pledge"].icon[1] = 9;
			Game.Upgrades["Elder Pledge"].icon[2] = 'img/icons.png';

			decay.fuse = 0;
			decay.soulClaimCountLocal = 0;
			decay.shinySoulClaimCountLocal = 0;
			decay.bombersPoppedLocal = 0;
			decay.phantomEssenceUsedLocal = 0;

			decay.thunderMarkerObj.enabled = false;
			decay.thunderMarkerObj.x = decay.thunderMarkerObj.scope.l.offsetWidth / 2;
			decay.thunderMarkerObj.y = decay.thunderMarkerObj.scope.l.offsetHeight * 0.4;

			decay.timesExhaustedLocal = 0;

			if (Game.ascensionMode == 42069) { decay.highestReachedChallenged = Math.max(Game.cookiesEarned, decay.highestReachedChallenged); }

			decay.removeAllWrinklerSouls();

			decay.togglePreP(false);

			decay.ascendIn = 0;

			if (!decay.keptClicks) { 
				decay.clicksKept += Math.floor(Game.cookieClicks / 100);
				decay.keptClicks = true;
			}

			decay.furnaceBoost = 1;
			decay.furnaceBurnRemaining = 0;

			decay.unlocked = false;
			decay.momentumUnlocked = false;
			decay.removeAllWrinklers();

			decay.killAllPowerOrbs(); 

			let lumps = Crumbs.getObjects('lump');
			for (let i in lumps) {
				lumps[i].die();
			}

			decay.prefs.preventNotifs.ascendReminder = true;

			if (decay.gen >= 21) { Game.Win("Corrupted and tainted"); }
			
			kaizoCookies.unpauseGame();
		}
		decay.onReincarnation = function() {
			Game.resetTCount();

			decay.unlocked = false;
			decay.momentumUnlocked = false;
			decay.bankedAcceleration = 0;
			decay.acceleration = 1;
			if (Game.ascensionMode == 42069) {
				decay.acceleration = decay.startingAcc;
				if (Game.Has('Vial of challenges')) { decay.triggerNotif('challenges'); }
			}
			if (Game.Has('Legacy')) { decay.triggerNotif('breakingPoint'); }
			decay.assignThreshold();
			decay.checkChallengeUnlocks();
			decay.resetAllChallengesInternalStatuses();
			decay.multList = [];
			decay.wrinklerSpawnRate = decay.setWrinklerSpawnRate();

			for (let i in decay.seFrees) { decay.seFrees[i] = 0; } 

			if (decay.challengeStatus('comboDragonCursor')) { Game.dragonLevel += 5; }

			decay.fatigue = 0;
			decay.exhaustion = 0;

			decay.clicksEligibleForPowerOrbs = 0;

			decay.bankedPurification = 0;

			kaizoCookies.lastPause = 0;

			decay.ascendUtenglobe();

			decay.removeAllWrinklerSouls();

			decay.resetScrolls();

			decay.recalculateLumpCarriers();

			if (decay.prefs.prestigeProgressDisplay && Game.prestige > 0 && Game.ascensionMode != 1) { decay.togglePreP(true); }
			else if (Game.ascensionMode == 1) { decay.togglePreP(false); }

			if (Game.Has('Voyager') && Game.ascensionMode != 42069) { Game.Objects.Shipment.getFree(1); }

			if (Game.Has('Purity key')) { decay.purityKeyState = 1; }

			if (Game.Has('Thunder marker')) { decay.thunderMarkerObj.enabled = true; }

			decay.touchOfForceCooldown = 0;
			if (decay.challengeStatus('pledge')) { Game.Upgrades['Touch of force [ACTIVE]'].buy(); }

			decay.boundlessSackOrbCount = 0;

			Game.hasTriggeredDifficultyRampingNotif = 0;

			decay.EOTWObj.targetComponent = null;

			decay.toResetWidget = true;

			for (let i in Game.Objects) {
				Game.Objects[i].everUnlocked = false;
			}
			decay.checkBuildingEverUnlocks();

			decay.dragonGutsKBMeter = 0;

			decay.keptClicks = false;

			decay.grabbedObj = [];
			
			decay.broken = 1;
			decay.gen = 1;

			if (Game.Has('Sugar burning')) { decay.adjustFurnaceUpgradeStatus(); }

			decay.checkHasScrollOnCooldown();

			decay.recalcAccStats();

			decay.performConditionalInits();

			if (decay.currentConditional && decay.challenges[decay.currentConditional].reincarnate) { 
				decay.challenges[decay.currentConditional].reincarnate();
			}
		}
		decay.onAfterReincarnation = function() {
			if (Game.Has('Virtues')) { Game.Upgrades['Boundless sack'].bought = 1; }
			Game.Upgrades['Boundless sack'].icon = [34, 12];

			decay.setRates();

			decay.halts['wSoul'].addHalt(10);
			decay.resetAll(1 + (Game.Has('Purity chips')?(Math.min(Math.log10(Game.heavenlyChips + 1), 19)):0));
		}
		Game.registerHook('reset', decay.onReincarnation);
		Game.registerHook('reincarnate', decay.onAfterReincarnation);
		Game.registerHook('reset', function(hard) { if (kaizoCookies.paused) { kaizoCookies.togglePause(); } if (hard) { decay.wipeSave(); } });
		eval('Game.HardReset='+Game.HardReset.toString().replace('Game.lumpRefill=0;', 'Game.lumpRefill=0; decay.setRates();'));
		decay.getCpSBoostFromPrestige = function() {
			/*
			let degradation = 1;
			if (Game.activePrestigeCount > 1000000) {
				degradation = 1 / (Math.log10(Game.activePrestigeCount / 1000000) * 2 + 1)
			}
				*/
			return Game.activePrestigeCount*Game.heavenlyPower * Game.GetHeavenlyMultiplier() * 0.01//*degradation;
		}

		//this is so the player can actually know what is going on
		decay.notifs = {
			initiate: {
				title: 'Decay',
				desc: 'Due to aging and corruption in your facilities, CpS continuously decreases over time. You can temporarily stop it from decreasing with certain actions, such as clicking the big cookie; the size of the cookie particles that come out while clicking the big cookie can indicate how much time left you have until decay starts picking back up again.',
				icon: [3, 1, kaizoCookies.images.custImg]
			},
			achievement: {
				title: 'Achievements',
				desc: 'REMOVED',
				icon: [5, 6]
			},
			purity: {
				title: 'Purity',
				desc: 'If you can purify all of your decay, any extra purification power will be spent as an increase in CpS. The extra CpS (called "purity") acts as a sacrifical buffer for the decay; however, the more purity you have, the more halting power will be needed to stop it, shown by increasing the number on the right side of the slash, below your CpS display.',
				icon: [10, 4, kaizoCookies.images.custImg]
			},
			wrinkler: {
				title: 'Wrinklers',
				desc: 'Wrinklers now spawn passively and do very bad things upon reaching the big cookie. Luckily, if you manage to pop them, you get to extract their souls which you can offer to the big cookie by dragging or flinging them into it, temporarily stopping decay.',
				icon: [19, 8],
				noPause: true
			},
			wrath: {
				title: 'Wrath cookies',
				desc: 'Wrath cookies now replace Golden cookies according to the amount of decay you have when it spawns; the more decay you have, the more often that Wraths replace Golden cookies. Luckily, it still purifies decay the same way as Golden cookies do.',
				icon: [15, 5],
				noPause: true
			},
			gpoc: {
				title: 'Grandmapocalypse', 
				desc: 'The Grandmapocalypse, in the vanilla sense, no longer exists.',
				icon: [27, 11],
				noPause: true
			}, 
			decayII: {
				title: 'decay: the return',
				desc: 'The decay gets stronger as you progress through the game, but you also obtain more items to help you fight it as the game goes on.',
				icon: [3, 1, kaizoCookies.images.custImg],
				noPause: true
			},
			veil: {
				title: 'Shimmering Veil',
				desc: 'HIDDEN',
				icon: [9, 10],
				noPause: true
			},
			buff: {
				title: 'Buffs under decay',
				desc: 'REMOVED',
				icon: [22, 6]
			},
			multipleBuffs: {
				title: 'Buff stacking',
				desc: 'REMOVED',
				icon: [23, 6]
			},
			fthof: {
				title: 'Force the Hand of Fate',
				desc: 'Notice: Force the Hand of Fate has its pool modified and have elder frenzy removed. Planners may not be accurate.',
				icon: [22, 11],
				noPause: true
			},
			purityCap: {
				title: 'Purity limit',
				desc: 'All methods of purification have a hard limit on how much purity they can apply. This limit varies per the method.<br>(Telling you this because you just reached a purity limit!)',
				icon: [10, 4, kaizoCookies.images.custImg],
				noPause: true
			},
			buildVariance: {
				title: 'Building size',
				desc: 'HIDDEN',
				icon: [2, 6]
			},
			momentum: {
				title: 'Decay momentum',
				desc: 'Your decay has grown so powerful that it has begun to create a force of its own, called momentum. Momentum steadily grows over time and provides a boost to required halting power, like having purity but without the decay rates boost. Unstoppable by most methods, you must use great souls conjured in the newly-unlocked "conjure" tab in your Utenglobe to reverse its progress. To progress past this point, you would definitely have to start doing challenges in the box of challenges.<br>Also, some descriptions may have been changed to include momentum!',
				icon: [2, 1, kaizoCookies.images.custImg]
				//sort of removed
			},
			boost: {
				title: 'Purity boosts',
				desc: 'Some upgrades decrease your decay, but not all decreases decrease the same thing! There are three main ways:<br>"Decay rate" - The amount of decay that gets generated per second<br>"Decay momentum" - The decay momentum, which increases the decay rate if the decay is left uninterrupted (requires a few quintillion cookies baked all time to unlock)<br>"Decay propagation" - Decay rates AND decay momentum',
				icon: [20, 6],
				noPause: true //sort of removed
			},
			autoclicker: {
				title: 'Autoclickers',
				desc: 'REMOVED',
				icon: [12, 0]
			},
			garden: {
				title: 'The garden',
				desc: 'The garden has been changed dramatically, mostly including buffs that make it stronger and getting or growing plants faster or more convenient.',
				icon: [2, 18],
				noPause: true
			},
			momentumPlus: {
				title: 'Too much momentum',
				desc: 'Momentum not only increases your rate of decay, but also makes methods that normally stop it less effective! There\'s really no way around it - if you got this much momentum, the only way to recover control is to keep clicking the cookie or popping wrinklers until it dies down.',
				icon: [2, 1, kaizoCookies.images.custImg]
			},
			pesudonat: {
				title: 'Pesudo-naturals',
				desc: 'HIDDEN',
				icon: [10, 14],
				noPause: true
			},
			momentumUnlock: {
				title: 'Momentum unlock',
				desc: function() { return loc('Momentum is only unlocked after obtaining at least %1 cookies this ascension. Before it\'s unlocked, momentum boosts do nothing.', [Beautify(5.555e18, 0)]); },
				icon: [2, 1, kaizoCookies.images.custImg]
			},
			shinyWrinkler: {
				title: 'Shiny wrinklers',
				desc: 'No, these are not 1 in 10,000 in this mod.',
				icon: [24, 12],
				noPause: true
			},
			reindeer: {
				title: 'Reindeers',
				desc: 'HIDDEN',
				icon: [12, 9]
			},
			stormDrop: {
				title: 'Cookie storm drops',
				desc: 'HIDDEN',
				icon: [11, 3],
				noPause: true
			},
			overtime: {
				title: 'Decay halting overtime',
				desc: 'HIDDEN',
				icon: [2, 3, kaizoCookies.images.custImg]
			},
			powerOrb: {
				title: 'Power orbs',
				desc: 'You can click them to damage them, but an easier way is to press space while hovering over them. Easy clicks and easy wrinklers are disabled while you can perform a power click.',
				icon: 0,
				noPause: true
			},
			dragonflight: {
				title: 'Dragonflight!',
				desc: 'HIDDEN',
				icon: [0, 25],
			},
			godzamok: {
				title: 'Godzamok reminder',
				desc: 'IRRELEVANT',
				icon: [23, 18]
			},
			fatigue: {
				title: 'Click fatigue & exhaustion',
				desc: 'The lethargy of the left background and the general dimming indicates fatigue, and once exhaustion sets in, you will need to find other ways (such as via wrinkler souls) to halt decay.<br>(also, if you are using an op autoclicker, you should stop now; clicking faster also makes you accumulate fatigue faster.)',
				icon: 0,
				noPause: true
			},
			degradation: {
				title: 'Prestige degradation',
				desc: 'REMOVED',
				icon: [10, 1, kaizoCookies.images.custImg]
			},
			breakingPoint: { 
				title: 'Breaking point',
				desc: 'If you haven\'t already, you might want to reread the description of the Legacy heavenly upgrade (the very first one and the prerequisite to all other heavenly upgrades) - it has been changed.',
				icon: [7, 3, kaizoCookies.images.custImg],
				noPause: true
			},
			wrinklerAmplify: {
				title: 'Wrinkler decay amplification',
				desc: 'REMOVED',
				icon: [19, 8]
			},
			soulExpiry: {
				title: 'Wrinkler soul expiry',
				desc: 'Free souls dissipates after enough time.',
				icon: 0,
				noPause: true
			},
			shinySoulEffect: {
				title: 'Friendly reminder',
				desc: 'A new pet has been unlocked! Check the bottom left of the game.',
				icon: [10, 3, kaizoCookies.images.custImg],
				noPause: true
			},
			accExtras: {
				title: 'Acceleration on halting',
				desc: 'Acceleration past x1.5 also increases decay gain like purity does, but is not as powerful as purity.',
				icon: [7, 0, kaizoCookies.images.custImg],
				noPause: true
			},
			challenges: {
				title: 'Decay challenges',
				desc: 'The challenges in this mod doesn\'t just serve as changes in gameplay, they also sometimes teach you certain vital game mechanics! Because of this, some of the challenges can be a little puzzly; if you find yourself not knowing what to do, you can check the rewards of the challenges; the rewards will usually have something to do with the solution to the challenge.',
				icon: [10, 12, kaizoCookies.images.custImg],
				noPause: true
			},
			combos: {
				title: 'Combos',
				desc: 'What you just performed is a combo, and also the simplest one, often called a "F+CF" by the community. It is already a powerful tool in vanilla, but here - it will be absolutely crucial to progression later on! This is because effects stack with themselves multiplicatively: all CpS buffs stack with themselves and they also multiply click power buffs due to the mouse upgrades making each click gain cookies equivalent to some percentage of your current CpS. Because of this, if your clicks made 1 second of CpS each, just a F+CF would give one and a half hours worth of CpS from every click!',
				icon: [22, 11],
				noPause: true
			},
			bombers: {
				title: 'Bombers',
				desc: 'Bombers explode after eating on the big cookie for a while. They might be actually very useful for you.<br>(if you are not up for the puzzle or can\'t figure it out, go to the options menu and invoke the "Bomber hint" notification!)',
				icon: [13, 1, kaizoCookies.images.custImg],
				noPause: true
			},
			bomberHint: {
				title: 'Bomber hint',
				desc: 'Bombers move much faster with less health, and explodes upon reaching the big cookie, inflicting coagulated and cursed, and distorted for 30 seconds which continuously spawns <b>low-health</b> bombers. All bombers spawned still grants souls, but can be popped very easily.',
				icon: [14, 1, kaizoCookies.images.custImg]
			},
			options: {
				title: 'Options',
				desc: 'Look into the options menu for accessibility options (especially if you play on a touchpad), the ability to pause the game, and to replay these informational notifications!<br>Also, a tip: try scrolling while hovering over the big cookie or a wrinkler. (scroll clicking has a cps cap, so scrolling faster doesn\'t do anything past a point)',
				icon: 0,
				noPause: true
			},
			purify: {
				title: 'Purification',
				desc: 'Clicking Golden or Wrath cookies can purify decay, essentially reversing its effects.',
				icon: [10, 4, kaizoCookies.images.custImg],
				noPause: true
			},
			ascendReminder: {
				title: 'Hmmm...',
				desc: 'Remember that, since you still haven\'t ascended, you can ascend! If all things seem hopeless, you can convert your current cookies to prestige and get a faster next run.',
				icon: [10, 1, kaizoCookies.images.custImg],
				noPause: true
			},
			difficultyRamping: {
				title: 'Difficulty ramping',
				desc: 'After some time has elapsed since the start of an ascension, the effective cookie count dictating difficulty will start to steadily increase, eventually reaching up to a small portion of your cookies baked all time - if you haven\'t reached that already.<br>If ramping is currently inflating the difficulty, you can see the exact cookie count your game is using to calculate decay-based mechanics in the stats menu.',
				icon: 0,
				noPause: true
			},
			lumps: {
				title: 'Sugar lumps',
				desc: 'Drag them over the center of big cookie for a few seconds to collect them.',
				icon: [29, 14],
				noPause: true
			},
			phantoms: {
				title: 'Phantom wrinklers',
				desc: 'Release a soul OVER them to briefly render them vulnerable to attacks!',
				icon: 0,
				noPause: true
			},
			phantomEssence: {
				title: 'Phantom essences',
				desc: 'Entangle a wrinkler by dropping one of those on them. The area of effect becomes bigger if the target is also a phantom wrinkler.',
				icon: [26, 16, kaizoCookies.images.custImg],
				noPause: true
			}
		}
		for (let i in decay.notifs) {
			if (typeof decay.notifs[i].desc == 'string') { addLoc(decay.notifs[i].desc); decay.notifs[i].desc = loc(decay.notifs[i].desc); }
			if (typeof decay.notifs[i].title == 'string') { addLoc(decay.notifs[i].title); decay.notifs[i].title = loc(decay.notifs[i].title); }
			decay.prefs.preventNotifs[i] = false;
			if (!decay.notifs[i].pref) { decay.notifs[i].pref = i; }
		} //it's always nice to support localizations
		addLoc('Momentum is only unlocked after obtaining at least %1 cookies this ascension. Before it\'s unlocked, momentum boosts do nothing.');
		decay.notifsLoaded = false;
		decay.triggerNotif = function(key, bypass) {
			if (!decay.notifsLoaded || Game.cookiesEarned + Game.cookiesReset < 55) { return; }
			if (typeof decay.prefs.preventNotifs[decay.notifs[key].pref] === 'undefined') { console.log('Corresponding pref not found. Input: '+key); return false; }
			if (decay.prefs.preventNotifs[decay.notifs[key].pref]) { if (typeof bypass === 'undefined' || !bypass) { return false; } } else if (!decay.notifs[key].noPause) { decay.autoPauseGame(); }
			Game.Notify(decay.notifs[key].title, (typeof decay.notifs[key].desc == 'function')?(decay.notifs[key].desc()):(decay.notifs[key].desc), decay.notifs[key].icon, 1e21, false, true);
			decay.prefs.preventNotifs[decay.notifs[key].pref] = true;
			decay.hasEncounteredNotif = true; 
		}
		decay.checkTriggerNotifs = function() {
			if (Game.drawT % 10 != 9) { return; }
			if (Game.cookiesEarned > 555) { decay.triggerNotif('options'); }
			if (decay.unlocked) { decay.triggerNotif('initiate'); }
			if (decay.gen > 1.2) { decay.triggerNotif('purity'); }
			//if (decay.gen <= 0.5) { decay.triggerNotif('gpoc'); }
			if (decay.incMult >= 0.08) { decay.triggerNotif('decayII'); }
			//if (Game.buffCount() && decay.gen <= 0.5) { decay.triggerNotif('buff'); }
			//if (Game.gcBuffCount() > 1) { decay.triggerNotif('multipleBuffs'); }
			//if (Game.Objects['Idleverse'].amount > 0 && Game.Objects['Cortex baker'].amount > 0) { decay.triggerNotif('buildVariance'); } //this is kinda dumb
			//if (decay.momentum > 1.001) { decay.triggerNotif('momentum'); }
			if (decay.momentum > 7.5) { decay.triggerNotif('momentumPlus'); }
			//if (Game.prestige > 1000000) { decay.triggerNotif('degradation'); }
			if (Game.resets < 1 && decay.gen < 0.001 && Game.cookiesEarned > 10000000 * Math.pow(decay.minimumPrestigeAmountToAscend, Game.HCfactor)) { decay.triggerNotif('ascendReminder'); } 
		}
		Game.registerHook('logic', decay.checkTriggerNotifs);
		decay.onWin = function(what) {
			if (['Morale boost', 'Glimmering hope', 'Saving grace', 'Last chance', 'Mass x velocity'].includes(what)) {
				//decay.purifyAll(1, 1, 1);
			}
			if (what == 'Mass x velocity') { decay.triggerNotif('momentum'); decay.autoPauseGame(); }
			if (what == 'Wrinkler poker') {
				const h = Crumbs.getObjects('w', 'left');
				for (let i in h) {
					decay.obliterateWrinkler(h[i]);
				}
			}
		}
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.onWin(what); Game.recalculateGains=1;'));
		eval('Game.shimmerTypes["golden"].initFunc='+Game.shimmerTypes["golden"].initFunc.toString().replace("me.wrath=1;", "me.wrath=1; decay.triggerNotif('purify');"));

		allValues('decay init');

		//ui and display and stuff
		decay.term = function(mult) {
			if (mult > 1) { return 'purity'; }
			return 'decay';
		}
		decay.toggle = function(prefName,button,on,off,invert) {
			if (decay.prefs[prefName])
			{
				l(button).innerHTML=off;
				decay.prefs[prefName]=0;
			}
			else
			{
				l(button).innerHTML=on;
				decay.prefs[prefName]=1;
			}
			l(button).className='smallFancyButton prefButton option'+((decay.prefs[prefName]^invert)?'':' off');
		}
		decay.prefPreset = function(name, desc, turnOns, turnOffs) {
			this.name = name;
			this.desc = desc;
			this.turnOns = turnOns;
			this.turnOffs = turnOffs;
			this.turnOnStr = '';
			for (let i in this.turnOns) {
				this.turnOnStr += '<b>' + decay.prefToNameMap[this.turnOns[i]] + '</b>, ';
			}
			this.turnOnStr = this.turnOnStr.slice(0, this.turnOnStr.length - 2);
			this.turnOffStr = '';
			for (let i in this.turnOffs) {
				this.turnOffStr += '<b>' + decay.prefToNameMap[this.turnOffs[i]] + '</b>, ';
			}
			this.turnOffStr = this.turnOffStr.slice(0, this.turnOffStr.length - 2);

			decay.prefPresets.push(this);
		}
		decay.prefToNameMap = {
			easyPurchases: loc('Convenient purchasing'),
			widget: loc('Informational widget'),
			typingDisplay: loc('Typing display'),
			fatigueWarning: loc('Fatigue warning'),
			bigSouls: loc('Big souls'),
			slowSouls: loc('Slow souls'),
			bigOrbs: loc('Big orbs'),
			slowOrbs: loc('Slow orbs'),
			comp: loc('Competition mode'),
			wipeOnInf: loc('Wipe save on infinite decay'),
			difficultyRamping: loc('Difficulty ramping'),
			easyTyping: loc('Easy typing'),
		}
		addLoc('Are you sure?');
		addLoc('You are about to apply the preset <b>"%1"</b>');
		addLoc('Applying this preset will have the following changes:');
		addLoc('%1 will be turned <b>ON</b>');
		addLoc('%1 will be turned <b>OFF</b>');
		decay.prefPreset.prototype.getPrompt = function() {
			//prompt when clicking to confirm and verify the settings that will be changed
			Game.Prompt(`<id prefPresetConfirmPrompt><h3>${loc('Are you sure?')}</h3><div class="block" style="line-height: 14px;">${loc('You are about to apply the preset <b>"%1"</b>', this.name)}.<br><small>"${this.desc}"</small></div>
			<div class="block" style="line-height: 14px;">
				${loc('Applying this preset will have the following changes:')}<div class="line"></div>
				${loc('%1 will be turned <b>ON</b>', this.turnOnStr)}<div class="line"></div>
				${loc('%1 will be turned <b>OFF</b>', this.turnOffStr)}
			</div>`, [[loc('Yes!'), 'decay.prefPresets['+decay.prefPresets.indexOf(this)+'].apply();Game.ClosePrompt();'], [loc('Nevermind')]], 0, 'widePrompt');
		}
		decay.prefPreset.prototype.apply = function() {
			for (let i in this.turnOns) {
				decay.prefs[this.turnOns[i]] = 1;
			}
			for (let i in this.turnOffs) {
				decay.prefs[this.turnOffs[i]] = 0;
			}
			Game.UpdateMenu();
		}
		decay.prefPresets = [];
		decay.lockedPreset = null;
		addLoc('Accessible'); addLoc('Intended / Default'); addLoc('True comp'); addLoc('True kaizo');
		new decay.prefPreset(loc('Accessible'), loc('A friendly and smooth experience, containing all the QoL and assistance tools available.'), ['easyPurchases', 'fatigueWarning', 'easyTyping', 'typingDisplay', 'widget', 'bigSouls', 'bigOrbs', 'slowSouls', 'slowOrbs'], ['wipeOnInf', 'comp', 'difficultyRamping']);
		new decay.prefPreset(loc('Intended / Default'), loc('The original designed experience of this mod, with QoL but minimal assistance tools.'), ['difficultyRamping', 'fatigueWarning', 'easyTyping', 'typingDisplay', 'widget', 'bigOrbs'], ['wipeOnInf', 'easyPurchases', 'comp', 'bigSouls', 'slowSouls', 'slowOrbs']);
		new decay.prefPreset(loc('True comp'), loc('A somewhat challenging experience, with a limited capacity to pause the game.'), ['difficultyRamping', 'typingDisplay', 'comp', 'widget'], ['fatigueWarning', 'wipeOnInf', 'easyPurchases', 'easyTyping', 'bigSouls', 'bigOrbs', 'slowSouls', 'slowOrbs']);
		new decay.prefPreset(loc('True kaizo'), loc('A challenging experience, with a limited access to information and only one live!'), ['difficultyRamping', 'comp', 'wipeOnInf'], ['typingDisplay', 'fatigueWarning', 'widget', 'easyPurchases', 'easyTyping', 'bigSouls', 'bigOrbs', 'slowSouls', 'slowOrbs']);
		decay.writePrefButton = function(prefName,button,on,off,callback,invert) {
			//I love stealing code from orteil
			invert=invert?1:0;
			if (!callback) callback='';
			callback+='PlaySound(\'snd/tick.mp3\');';
			return '<a class="smallFancyButton prefButton option'+((decay.prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="decay.toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(decay.prefs[prefName]?on:off)+'</a>';
		}
		decay.writeInfoSnippetButton = function(prefName, button) {
			if (!decay.prefs.preventNotifs[decay.notifs[prefName].pref]) { return ''; }
			return '<a class="smallFancyButton" style="margin: 5px; " id="'+button+'"'+Game.clickStr+'="decay.triggerNotif(\''+prefName+'\', true);">'+decay.notifs[prefName].title+'</a>';
		}
		addLoc('Kaizo cookies settings');
		addLoc('Invoking a difficulty preset configures your Kaizo cookies settings, and can be readjusted at any time. Presets do not override all settings.');
		addLoc('Difficulty presets:');
		addLoc('Ascend on infinite decay');
		addLoc('Wipe save on infinite decay');
		addLoc('Upon reaching infinite decay, ascend without gaining any prestige or heavenly chips');
		addLoc('Informational widget');
		addLoc('Widget below the big cookie that displays information without having to look into the stats menu.');
		addLoc('Easy clicks');
		addLoc('Allows you to click the big cookie by scrolling, but click speed is capped to 10 clicks per second.');
		addLoc('Easy wrinklers');
		addLoc('Allows you to automatically click wrinklers you are hovering over by scrolling, but click speed is capped to 10 clicks per second.');
		addLoc('Touchpad mode');
		addLoc('For touchpad users; changes the mod to be more accomodating of touchpads. See the list of changes <span onclick="decay.touchpadModePrompt();" style="text-decoration: underline; cursor: pointer;">here</span>.');
		addLoc('Automatically activate easy clicks or easy wrinklers by holding down A while hovering over the big cookie or a wrinkler, respectively.');
		addLoc('The A key also functions as clicks for wrinkler souls and power orbs.');
		addLoc('Note: if you are having issues with your touchpad\'s range or speed, try adjusting its sensitivity; if that still isn\'t enough, you may also pause the game with the hotkey to reposition your mouse as needed.');
		addLoc('Show run timer');
		addLoc('Shows a more accurate timer of the run started stat.');
		addLoc('Show legacy timer');
		addLoc('Shows a more accurate timer of the legacy started stat.');
		addLoc('<b>none.</b><br><small>(You can see and replay information snippets you\'ve collected throughout the game here. The first one occurs at 5,555 cookies baked this ascension.)</small>');
		addLoc('Typing display');
		addLoc('Shows your keyboard inputs in real time. Only works with the Script writer heavenly upgrade.');
		addLoc('Shift to Power click');
		addLoc('Instead of holding shift to prevent power clicks from being used, have power clicks only enabled while holding shift');
		addLoc('Competition mode');
		addLoc('Adds a 1 minute, 30 seconds long cooldown to pausing the game.');
		addLoc('Convenient purchasing');
		addLoc('Assist option; allows you to perform simple actions such as purchasing upgrades, interacting with minigames, and using switches while paused.');
		addLoc('Auto pause on leave');
		addLoc('Automatically pauses the game if it detects that you haven\'t been looking at it for 5 seconds.');
		addLoc('Fatigue warning');
		addLoc('Warns you about how close you are to becoming exhausted upon reaching certain fatigue thresholds.');
		addLoc('Big souls');
		addLoc('Assist option; all wrinkler souls are much bigger');
		addLoc('Big orbs');
		addLoc('Assist option; all power orbs are much bigger');
		addLoc('Slow souls');
		addLoc('Assist option; all wrinkler souls are significantly slower');
		addLoc('Slow orbs');
		addLoc('Assist option; all power orbs are significantly slower');
		addLoc('Difficulty ramping');
		addLoc('Slowly increases minimum effective progress for calculating decay-related stats over time, up to a fraction of the total amount of cookies you have baked across all ascensions');
		addLoc('Easy typing');
		addLoc('Assist option; allows you to use the Script writer while paused');
		addLoc('Scroll cooldown display');
		addLoc('Displays active scroll cooldowns in a panel above the buildings and minigames');
		addLoc('Prestige progress display');
		addLoc('Displays current amount of prestige unleashed; only appears after ascending');
		decay.prefToNameMap = {
			easyPurchases: loc('Convenient purchasing'),
			widget: loc('Informational widget'),
			typingDisplay: loc('Typing display'),
			fatigueWarning: loc('Fatigue warning'),
			bigSouls: loc('Big souls'),
			slowSouls: loc('Slow souls'),
			bigOrbs: loc('Big orbs'),
			slowOrbs: loc('Slow orbs'),
			comp: loc('Competition mode'),
			wipeOnInf: loc('Wipe save on infinite decay')
		}
		injectCSS(`.block.infoSnippetBox { margin-top: 5px; text-align: center; }`);
		decay.getPrefButtons = function() {
			let str = '</div><div class="title">'+loc('Kaizo cookies settings')+'</div><div class="listing">';
			str += '<b>'+loc('Difficulty presets:')+'</b><br>';
				str += '<label style="margin-bottom: 12px; margin-top: 4px; padding-left: 0px; padding-right: 0px;">' + loc('Invoking a difficulty preset configures your Kaizo cookies settings, and can be readjusted at any time. Presets do not override all settings.') + '</label><br><br>';
				for (let i in decay.prefPresets) {
					str += '<a class="smallFancyButton" style="margin: 5px; " id=""'+Game.clickStr+'="decay.prefPresets['+i+'].getPrompt();">'+decay.prefPresets[i].name+'</a><label>('+decay.prefPresets[i].desc+')</label><br>';
				}
			str += '<div class="line"></div>';
			//str += decay.writePrefButton('ascendOnInf', 'AscOnInfDecayButton', loc('Ascend on infinite decay')+' ON', loc('Ascend on infinite decay')+' OFF')+'<label>('+loc("Upon reaching infinite decay, ascend without gaining any prestige or heavenly chips")+')</label><br>';
				str += decay.writePrefButton('scrollClick', 'scrollClickButton', loc('Easy clicks')+' ON', loc('Easy clicks')+' OFF')+'<label>('+loc('Allows you to click the big cookie by scrolling, but click speed is capped to 10 clicks per second.')+')</label><br>';
				str += decay.writePrefButton('scrollWrinklers', 'scrollWrinklersButton', loc('Easy wrinklers')+' ON', loc('Easy wrinklers')+' OFF')+'<label>('+loc('Allows you to automatically click wrinklers you are hovering over by scrolling, but click speed is capped to 10 clicks per second.')+')</label><br>';
				str += decay.writePrefButton('touchpad', 'touchpadButton', loc('Touchpad mode')+' ON', loc('Touchpad mode')+' OFF')+'<label>('+loc('For touchpad users; changes the mod to be more accomodating of touchpads. See the list of changes <span onclick="decay.touchpadModePrompt();" style="text-decoration: underline; cursor: pointer;">here</span>.')+')</label><br>';
				str += decay.writePrefButton('autoPause', 'autoPauseButton', loc('Auto pause on leave')+' ON', loc('Auto pause on leave')+' OFF')+'<label>('+loc('Automatically pauses the game if it detects that you haven\'t been looking at it for 5 seconds.')+')</label><br>';
				str += decay.writePrefButton('powerClickShiftReverse', 'PCShiftReverseButton', loc('Shift to Power click')+' ON', loc('Shift to Power click')+' OFF')+'<label>('+loc('Instead of holding shift to prevent power clicks from being used, have power clicks only enabled while holding shift')+')</label><br>';
				str += decay.writePrefButton('scrollCDDisplay', 'scrollCDDisplayButton', loc('Scroll cooldown display')+' ON', loc('Scroll cooldown display')+' OFF', 'decay.checkHasScrollOnCooldown();')+'<label>('+loc('Displays active scroll cooldowns in a panel above the buildings and minigames')+')</label><br>';
				str += decay.writePrefButton('RunTimer','RunTimerButton',loc("Show run timer")+' ON',loc("Show run timer")+' OFF', 'if (decay.prefs.RunTimer) { l(\'Timer\').style.display = \'\'; } else { l(\'Timer\').style.display = \'none\'; }')+'<label>('+loc('Shows a more accurate timer of the run started stat.')+')</label><br>';
				str += decay.writePrefButton('LegacyTimer','LegacyTimerButton',loc("Show legacy timer")+' ON',loc("Show legacy timer")+' OFF', 'if (decay.prefs.LegacyTimer) { l(\'Timer2\').style.display = \'\'; } else { l(\'Timer2\').style.display = \'none\'; }')+'<label>('+loc('Shows a more accurate timer of the legacy started stat.')+')</label><br>';
				str += decay.writePrefButton('prestigeProgressDisplay', 'prestigeProgressDisplayButton',loc('Prestige progress display')+' ON',loc('Prestige progress display')+' OFF', 'if (Game.prestige > 0 && Game.ascensionMode != 1) { if (decay.prefs.prestigeProgressDisplay) { decay.togglePreP(true); } else { decay.togglePreP(false); } }')+'<label>('+loc('Displays current amount of prestige unleashed; only appears after ascending')+')</label><br>';
				str += '<div class="line"></div>';
				if (!decay.lockedPreset) {
					str += decay.writePrefButton('easyPurchases', 'easyPurchasesButton', loc('Convenient purchasing')+' ON', loc('Convenient purchasing')+' OFF')+'<label>('+loc('Assist option; allows you to perform simple actions such as interacting with minigames, purchasing upgrades, and using switches while paused.')+')</label><br>';
					str += decay.writePrefButton('widget', 'widgetButton', loc('Informational widget')+' ON', loc('Informational widget')+' OFF')+'<label>('+loc('Widget below the big cookie that displays information without having to look into the stats menu. (only works when decay is unlocked)')+')</label><br>';
					str += decay.writePrefButton('typingDisplay', 'typingDisplayButton', loc('Typing display')+' ON', loc('Typing display')+' OFF', 'if (decay.prefs.typingDisplay) { l(\'typingDisplayContainer\').style.display = \'\' } else { l(\'typingDisplayContainer\').style.display = \'none\'; }')+'<label>('+loc('Shows your keyboard inputs in real time. Only works with the Script writer heavenly upgrade.')+')</label><br>';
					str += decay.writePrefButton('fatigueWarning', 'fatigueWarningButton', loc('Fatigue warning')+' ON', loc('Fatigue warning')+' OFF')+'<label>('+loc('Warns you about how close you are to becoming exhausted upon reaching certain fatigue thresholds.')+')</label><br>';
					str += decay.writePrefButton('easyTyping', 'easyTypingButton', loc('Easy typing')+' ON', loc('Easy typing')+' OFF')+'<label>('+loc('Assist option; allows you to use the Script writer while paused')+')</label><br>';
					str += decay.writePrefButton('bigSouls', 'bigSoulsButton', loc('Big souls')+' ON', loc('Big souls')+' OFF')+'<label>('+loc('Assist option; all wrinkler souls are much bigger')+')</label><br>';
					str += decay.writePrefButton('slowSouls', 'slowSoulsButton', loc('Slow souls')+' ON', loc('Slow souls')+' OFF')+'<label>('+loc('Assist option; all wrinkler souls are significantly slower')+')</label><br>';
					str += decay.writePrefButton('bigOrbs', 'bigOrbsButton', loc('Big orbs')+' ON', loc('Big orbs')+' OFF')+'<label>('+loc('Assist option; all power orbs are much bigger')+')</label><br>';
					str += decay.writePrefButton('slowOrbs', 'slowOrbsButton', loc('Slow orbs')+' ON', loc('Slow orbs')+' OFF')+'<label>('+loc('Assist option; all power orbs are significantly slower')+')</label><br>';
					str += decay.writePrefButton('difficultyRamping', 'difficultyRampingButton', loc('Difficulty ramping')+' ON', loc('Difficulty ramping')+' OFF')+'<label>('+loc('Slowly increases minimum effective progress for calculating decay-related stats over time, up to a fraction of the total amount of cookies you have baked across all ascensions')+')</label><br>';
					str += decay.writePrefButton('comp', 'compButton', loc('Competition mode')+' ON', loc('Competition mode')+' OFF')+'<label>('+loc('Adds a 1 minute, 30 seconds long cooldown to pausing the game.')+')</label><br>';
					str += decay.writePrefButton('wipeOnInf', 'WipeOnInfDecayButton', loc('Wipe save on infinite decay')+' ON', loc('Wipe save on infinite decay')+' OFF')+'<label>('+loc("Upon reaching infinite decay, wipe save")+')</label><br>';
				}
			str += '<div class="line"></div><b>Replay information snippets:</b><br><div class="block infoSnippetBox">';
			let str2 = '';
			for (let i in decay.notifs) {
				str2 += decay.writeInfoSnippetButton(i, i+' Button')+'';
			}
			if (str2 == '') {
				str2 = loc('<b>none.</b><br><small>(You can see and replay information snippets you\'ve collected throughout the game here. The first one occurs at 5,555 cookies baked this ascension.)</small>');
			}
			return str + str2 + '</div></div>';
		}
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
			 .replace(`rs; game will reload")+')</label><br>'+`, `rs; game will reload")+')</label><br>'+decay.getPrefButtons()+`)
			 .replace(`(App?'<div class="listing"`,`'<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="kaizoCookies.togglePause();Game.UpdateMenu();">'+(kaizoCookies.paused?loc('Unpause'):loc('Pause'))+'</a><label>'+loc('Assist option; shortcuts: Shift+C OR Shift+P')+'</label></div><br>'+(App?'<div class="listing"`)
			 .replace(`Beautify(dropMult,2)+'</div>':'')+`, `Beautify(dropMult,2)+'</div>':'')+'<div class="listing"><b>'+loc("Times paused: ")+'</b> '+Beautify(decay.gamePausedCount)+'</div>'+`)
			 .replace(`parseFloat(Game.prestige)*Game.heavenlyPower*heavenlyMult`, `decay.getCpSBoostFromPrestige()`)
		);
		injectCSS('#Timer1 { pointer-events: none; }');
		injectCSS('#Timer2 { pointer-events: none; }');
		decay.touchpadModePrompt = function() {
			Game.Prompt('<id touchpadModePrompt><h3>' + loc('Touchpad mode') + '</h3><div class="block">'+loc('Automatically activate easy clicks or easy wrinklers by holding down A while hovering over the big cookie or a wrinkler, respectively.')+'<div class="line"></div>'+loc('The A key also functions as clicks for wrinkler souls and power orbs.')+'<div class="line"></div>'+loc('Note: if you are having issues with your touchpad\'s range or speed, try adjusting its sensitivity; if that still isn\'t enough, you may also pause the game with the hotkey to reposition your mouse as needed.')+'</div>', []);
		}
		l('versionNumber').style.pointerEvents = 'none';
		l('httpsSwitch').style.pointerEvents = 'all';

		decay.getCpsDiffFromDecay = function() {
			let prev = 0;
			let post = 0;
			for (let i in Game.Objects) {
				prev += decay.buildCpsWithoutDecay[i](Game.Objects[i]);
				post += Game.Objects[i].cps(Game.Objects[i]);
			}
			return post / prev;
		};
		
		decay.getDec = function() {
			if (decay.cpsList.length < Game.fps * 1.5) { return ''; }

			let repeatedFirst = [];
			for (let i = 0; i < 10; i++) {
				repeatedFirst.push(decay.cpsList[0]); //this makes the math incorrect, but the tradeoff of making clicking feel much more powerful and immediate, is well worth it
			}
			let str = ((1 - geometricMean(decay.cpsList.slice(0, Math.min(30, decay.cpsList.length)).concat(repeatedFirst)) / decay.cpsList[0]) * 100).toFixed(2);
			//geometric mean makes it fit better to large jumps in cps, also it is always less than arithmetic mean so it makes user feel better lol (ortroll)
			if (str.includes('-')) {
				str = str.replace('-', '+');
			} else {
				str = '-' + str;
			}
			return ' (' + str + '%/s)';
		}
		addLoc('halt: %1 / %2');
		addLoc('(fully halted)');
		addLoc('(x%1 decay)');
		injectCSS('#haltingAmount { font-size: 50%; padding-top: 2px; }');
		injectCSS('.wrinkled { color: #f00; }');
		eval('Game.Draw='+Game.Draw.toString().replace(`ify(Game.cookiesPs*(1-Game.cpsSucked),1)+'</div>';`, `ify(Game.cookiesPs*(1-Game.cpsSucked),1)+decay.getDec()+'</div><div id="haltingAmount" style="'+((decay.effectiveHalt && decay.unlocked)?'':'display: none')+'">'+loc('halt: %1 / %2', [Beautify(decay.effectiveHalt, 2), Beautify(decay.requiredHalt - Game.suckingCount, 2)+(Game.suckingCount?('+<span class="wrinkled">'+Beautify(Game.suckingCount)+'</span>'):'')])+' '+(decay.effectiveHalt?(decay.effectiveHalt>=decay.requiredHalt?loc('(fully halted)'):loc('(x%1 decay)', Beautify(1 - (decay.effectiveHalt / decay.requiredHalt), 2))):'')+'</div>';`));

		decay.diffStr = function() {
			if (!decay.unlocked) { return ''; }
			let str = '<b>CpS multiplier from '+decay.term(decay.cpsDiff)+': </b>';
			if (decay.gen < 0.0001) {
				str += '1 / ';
				str += Beautify(1 / decay.gen);
			} else { 
				if (decay.gen > 1) { 
					str += '<small>+</small>'; 
					str += Beautify(((decay.gen - 1) * 100), 3);
				} else { 
					str += '<small>-</small>'; 
					str += Beautify(((1 - decay.gen) * 100), 3);
				}
				str += '%';
			}
			return str;
		}

		addLoc('Decay rate multiplier from your momentum:');
		decay.momentumStr = function() {
			if (!decay.unlocked) { return ''; }
			let str = '<b>'+loc('Decay rate multiplier from your momentum:')+'</b> x';
			str += Beautify(decay.TSMultFromMomentum, 3);
			return str;
		}

		addLoc('Decay propagation multiplier from your acceleration:');
		decay.accStr = function() {
			let str = '<b>'+loc('Decay propagation multiplier from your acceleration:')+'</b> x';
			str += Beautify(decay.acceleration, 4);
			return str;
		}

		decay.effectStrs = function(funcs, id) {
			let num = 0;
			if (typeof id != 'number') { num = decay.cpsDiff; } else { num = decay.get(id); }
			if (Array.isArray(funcs)) { 
				for (let i in funcs) {
					num = funcs[i](num, i);
				}
			}
			let str = '';
			if (num > 1) { 
				str += '<small>+</small>'; 
				str += Beautify(((num - 1) * 100), 3);
				str += '%';
			} else if (num >= 0.0001) { 
				str += '<small>-</small>'; 
				str += Beautify(((1 - num) * 100), 3);
				str += '%';
			} else {
				str += '1 / ';
				str += Beautify(1 / num);
			}
			return str;
		}

		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].tooltip='+Game.Objects[i].tooltip.toString().replace(`okie",LBeautify(me.totalCookies)))+'</div>')`, `okie",LBeautify(me.totalCookies)))+'</div>')+(Game.Has('Purification domes')?('<div class="descriptionBlock">Production multiplier <b>'+decay.effectStrs([], me.id)+'</b> from your '+((decay.get(me.id)>1)?'purity':'decay')+' for this building.</div>'):'')`));
		}
		eval('Game.Object='+Game.Object.toString().replace(`okie",LBeautify(me.totalCookies)))+'</div>')`, `okie",LBeautify(me.totalCookies)))+'</div>')+(Game.Has('Purification domes')?('<div class="descriptionBlock">Production multiplier <b>'+decay.effectStrs([], me.id)+'</b> from your '+((decay.get(me.id)>1)?'purity':'decay')+' for this building.</div>'):'')`))

		addLoc('with %1 of active time');
		Game.getWithered = function() {
			if (Game.cpsSucked > 0.99) {
				return SimpleBeautify(Math.round((1 / (1 - Game.cpsSucked)) - 1), 0)+' / '+Beautify(Math.round(1 / (1 - Game.cpsSucked)), 0);
			} else {
				return SimpleBeautify(Math.round(Game.cpsSucked*100),1)+'%';
			}
		}
		addLoc('additionally: ');
		decay.reactiveStats = {};
		decay.reactiveStat = function(returnFunc, original, newCode, id, updateRate) {
			if (original) { eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(original, newCode.replace('[[REF]]', 'decay.reactiveStats["'+id+'"].returnFunc()'))); }
			this.id = id;
			this.returnFunc = returnFunc;
			this.updateRate = updateRate ?? 1;
			decay.reactiveStats[id] = this;
		}
		decay.reactiveStat.prototype.update = function() {
			if (l(this.id)) { 
				l(this.id).innerHTML = this.returnFunc();
			}
		}
		new decay.reactiveStat(
			function() { return decay.diffStr() + (decay.hasExtraPurityCps?(' <small>('+loc('additionally: ')+'x'+Beautify(decay.extraPurityCps, 4)+')</small>'):''); }, 
			`giftStr+'</div>':'')+`, 
			`giftStr+'</div>':'')+'<div id="decayMultD" class="listing">'+[[REF]]+(true?'':'ANCHOR')+'</div>'+`, 
			'decayMultD'
		);
		new decay.reactiveStat(
			function() { return Beautify(Game.cookiesPs,1); },
			`loc("Cookies per second:")+'</b> '+Beautify(Game.cookiesPs,1)`,
			`loc("Cookies per second:")+'</b> <span id="CpSD">'+Beautify(Game.cookiesPs,1)+'</span>'`,
			'CpSD'
		);
		new decay.reactiveStat(
			function() { return Beautify(Math.round(Game.globalCpsMult*100),1); },
			`loc("multiplier:")+' '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'`,
			`loc("multiplier:")+' <span id="GlobMultD">'+[[REF]]+'</span>%)'`,
			'GlobMultD'
		);
		new decay.reactiveStat(
			function() { return Beautify(Game.cookiesPsRaw,1); },
			`'</b> '+Beautify(Game.cookiesPsRaw,1)`,
			`'</b> <span id="rawCpSD">'+[[REF]]+'</span>'`,
			'rawCpSD'
		);
		new decay.reactiveStat(
			function() { return Beautify(Game.cookiesPsRawHighest,1); },
			`' '+Beautify(Game.cookiesPsRawHighest,1)+')'`,
			`' <span id="rawCpSHighestD">'+[[REF]]+'</span>)'`,
			'rawCpSHighestD'
		);
		addLoc('direct multiplier: x%1');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`'</b> '+Beautify(Game.computedMouseCps,1)+'</div>'+`, `'</b> '+Beautify(Game.computedMouseCps,1)+' <small>('+loc('direct multiplier: x%1', Beautify(Game.clickMult, 2))+')</small></div>'+`))
		new decay.reactiveStat(
			function() { return Beautify(Game.computedMouseCps,1); },
			`'</b> '+Beautify(Game.computedMouseCps,1)`,
			`'</b> <span id="CpCD">'+[[REF]]+'</span>'`,
			'CpCD'
		);
		new decay.reactiveStat(
			function() { return decay.momentumStr(); },
			`(true?'':'ANCHOR')+'</div>'`,
			`(true?'':'ANCHOR')+'</div>'+'<div class="listing" style="'+(decay.momentumUnlocked?'':'display:none;')+'"><span id="decayMomentumMultD">'+decay.momentumStr()+(true?'':'ANCHORMOMENTUM')+'</span></div>'`,
			'decayMomentumMultD'
		);
		new decay.reactiveStat(
			function() { return decay.accStr(); },
			`(true?'':'ANCHORMOMENTUM')+'</span></div>'`,
			`(true?'':'ANCHORMOMENTUM')+'</span></div>'+'<div class="listing" style="'+((Game.ascensionMode===42069)?'':'display:none;')+'"><span id="decayAccD">'+decay.accStr()+'</span></div>'`,
			'decayAccD'
		);
		new decay.reactiveStat(
			function() { return loc('with %1 of active time', Game.sayTime(Game.TCount, -1)); },
			`'<div class="listing"><b>'+loc("Run started:")+'</b> '+(startDate==''?loc("just now"):loc("%1 ago",startDate))+'</div>'+`, 
			`'<div class="listing"><b>'+loc("Run started:")+'</b> '+(startDate==''?loc("just now"):loc("%1 ago",startDate))+', <span id="activeTimeD">'+[[REF]]+'</span></div>'+`,
			'activeTimeD', 5
		);
		new decay.reactiveStat(
			function() { return loc("%1 remaining", Game.sayTime(Game.researchT,-1)); },
			`'</b> '+loc("%1 remaining",researchStr)+'</div>'`,
			`'</b> <span id="researchTimeD">'+[[REF]]+'</span></div>'`,
			'researchTimeD', 5
		);
		new decay.reactiveStat(
			function() { return loc("%1 remaining", Game.sayTime(Game.pledgeT,-1)); },
			`loc("Pledge:")+'</b> '+loc("%1 remaining",pledgeStr)+'</div>'`,
			`loc("Pledge:")+'</b> <span id="pledgeTimeD">'+[[REF]]+'</span></div>'`,
			'pledgeTimeD', 5
		);
		addLoc('for decay-related calculations due to ramping: ');
		new decay.reactiveStat(
			function() { return Beautify(Math.pow(10, Game.log10CookiesSimulated)); },
			`Beautify(Game.cookiesEarned)+'</div></div>'+`,
			`Beautify(Game.cookiesEarned)+'</div>'+(Game.log10CookiesSimulated>Game.log10Cookies?(' <b>('+loc('for decay-related calculations due to ramping: ')+'</b><div class="price plain">'+Game.tinyCookie()+'<span id="simulatedCookiesD">'+[[REF]]+'</span></div><b>)</b>'):'')+'</div>'+`,
			'simulatedCookiesD'
		);
		Game.cookieClicksGlobal = 0;
		Game.registerHook('click', function() { Game.cookieClicksGlobal++; });
		addLoc('total: ');
		addLoc('kept: ');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`'<div class="listing"><b>'+loc("Cookie clicks:")+'</b> '+Beautify(Game.cookieClicks)+'</div>'+`, `'<div class="listing"><b>'+loc("Cookie clicks:")+'</b> '+Beautify(Game.cookieClicks)+' <small>('+(decay.clicksKept?(loc('kept: ')+Beautify(decay.clicksKept)+'; '):'')+loc('total: ')+Beautify(Game.cookieClicksGlobal)+(decay.cookieClicksTotalNGM==Game.cookieClicksGlobal?'':('; '+loc('cross-legacies total: ')+Beautify(decay.cookieClicksTotalNGM)))+')</small></div>'+`));
		new decay.reactiveStat(
			function() { return Beautify(Game.cookieClicks); },
			`Beautify(Game.cookieClicks)`,
			`'<span id="cookieClicks">'+[[REF]]+'</span>'`,
			'cookieClicks', 1
		);
		new decay.reactiveStat(
			function() { return Beautify(Game.cookieClicksGlobal); },
			`Beautify(Game.cookieClicksGlobal)`,
			`'<span id="cookieClicksGlobal">'+[[REF]]+'</span>'`,
			'cookieClicksGlobal', 1
		);
		new decay.reactiveStat(
			function() { return Game.sayTime(decay.exhaustion, -1); },
			`'+Game.sayTime(decay.exhaustion, -1)+`,
			`<span id="exhaustionTime">'+[[REF]]+'</span>'+`,
			'exhaustionTime', 5
		);
		decay.updateStats = function() {
			if (Game.onMenu=='stats') { 
				for (let i in decay.reactiveStats) {
					if (Game.T % decay.reactiveStats[i].updateRate == 0) { 
						decay.reactiveStats[i].update();
					}
				}
			}
		}
		decay.forceUpdate = function(stat) {
			decay.reactiveStats[stat].update();
		}
		Game.UpdateMenu();
		//"D" stands for display, mainly just dont want to conflict with any other id and lazy to check

		var newDiv = document.createElement('div'); 
		newDiv.id = 'decayWidget'; 
		injectCSS('.leftSectionWidget { font-size: 26px; text-shadow: rgb(0, 0, 0) 0px 1px 4px; position: relative; text-align: center; padding: 3px; display: inline-block; z-index: 6; left: 50%; transform: scale(0.75) translate(-66.7%, -133.3%); background: rgba(0, 0, 0, 0.4); line-height: 1.25; border-radius: 10px; pointer-events: none; }'); //wtf is this black magic
		injectCSS('.widgetDisplay { position: relative; display:inline-flex; justify-content: center; align-items: center; width: 100%; margin: 4px 0px 4px 0px; }');
		injectCSS('.brActor { position: relative; padding: 0px 0px 0px 0px; }');
		injectCSS('.widgetText { display: inline; margin: 4px 58px 4px 58px; }');
		injectCSS('.widgetIcon { position: absolute; }');
		injectCSS('.widgetIcon.toLeft { left: 0; }');
		injectCSS('.widgetIcon.toRight { right: 0; }');
		newDiv.classList.add('leftSectionWidget');
		newDiv.style = 'top: 500px;'; 
		l('sectionLeft').appendChild(newDiv);
		decay.toResetWidget = true;
		decay.setWidget = function() {
			const avail = decay.unlocked || decay.momentumUnlocked || (Game.ascensionMode === 42069);
			if (!decay.prefs.widget || !avail || Game.AscendTimer) { l('decayWidget').style = 'display:none;'; return false; }
			if (!decay.unlocked) { l('decayCpsMult').style = 'display:none'; } else { l('decayCpsMult').style = ''; }
			if (!decay.momentumUnlocked) { l('decayMomentum').style = 'display:none'; } else { l('decayMomentum').style = ''; }
			if (Game.ascensionMode !== 42069) { l('decayAcceleration').style = 'display:none'; } else { l('decayAcceleration').style = ''; }
			if (decay.hasExtraPurityCps) { l('decayCpsData').style.margin = '4px 58px 0px 58px'; } else { l('decayCpsData').style.margin = ''; }
			if (decay.gen > 1) {
				l('decayRateIconLeft').style = writeIcon([10, 4, kaizoCookies.images.custImg]);
				l('decayRateIconRight').style = writeIcon([10, 4, kaizoCookies.images.custImg]);
			} else {
				l('decayRateIconLeft').style = writeIcon([3, 1, kaizoCookies.images.custImg]);
				l('decayRateIconRight').style = writeIcon([3, 1, kaizoCookies.images.custImg]);
			}
			let verticalPlacement = 0.95; 
			let verticalOffset = 0;
			if (Game.specialTab != '' && l('specialPopup')) {
				verticalOffset -= l('specialPopup').offsetHeight;
			}
			verticalPlacement = Math.max(verticalPlacement * l('sectionLeft').offsetHeight, 250) + verticalOffset;
			l('decayWidget').style = 'top:'+verticalPlacement+'px';

			decay.updateWidget();
		}
		decay.updateWidget = function() {
			let str = '';
			str = decay.effectStrs();
			l('decayCpsData').innerHTML = str+(decay.hasExtraPurityCps?'<br><div style="font-size: 16px;">x'+Beautify(decay.extraPurityCps, 4)+'</div>':'');
			l('decayMomentumData').innerText = 'x'+Beautify(decay.TSMultFromMomentum, 3);
			l('decayAccelerationData').innerText = 'x'+Beautify(decay.acceleration, 4);
		}
		window.addEventListener('resize', function() { decay.toResetWidget = true; });
		Game.registerHook('check', function() { decay.toResetWidget = true; });
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().slice(0, Game.ToggleSpecialMenu.toString().length - 1) + 'decay.toResetWidget = true;' + '}');
		addLoc('CpS multiplier from your decay');
		addLoc('Decay rate multiplier from your momentum');
		addLoc('Decay propagation multiplier from your acceleration');
		l('decayWidget').innerHTML = (`<div id="decayCpsMult" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('CpS multiplier from your decay/purity')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" id="decayRateIconLeft" style="`+writeIcon([3, 1, kaizoCookies.images.custImg])+`"></div>`+`<div id="decayCpsData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" id="decayRateIconRight" style="`+writeIcon([3, 1, kaizoCookies.images.custImg])+`"></div></div>`+
			`<div id="brActor1" class="brActor"></div>`+
			`<div id="decayMomentum" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('Decay rate multiplier from your momentum')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" style="`+writeIcon([2, 1, kaizoCookies.images.custImg])+`"></div>`+`<div id="decayMomentumData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" style="`+writeIcon([2, 1, kaizoCookies.images.custImg])+`"></div></div>`+
			`<div id="brActor2" class="brActor"></div>`+
			`<div id="decayAcceleration" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('Decay propagation multiplier from your acceleration')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" style="`+writeIcon([7, 0, kaizoCookies.images.custImg])+`"></div>`+`<div id="decayAccelerationData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" style="`+writeIcon([7, 0, kaizoCookies.images.custImg])+`"></div></div>`
		);
		Crumbs.spawn({
			id: 'cursorOrb',
			imgs: kaizoCookies.images.glow,
			scaleX: 0.005,
			scaleY: 0.005,
			behaviors: function() {
				if (!decay.prefs.scrollClick && !decay.prefs.scrollWrinklers && !decay.prefs.touchpad) { this.noDraw = true; } else { this.noDraw = false; }
				this.x = this.scope.mouseX;
				this.y = this.scope.mouseY;
				if (Game.hasBuff('Power surge')) { this.scaleX = 0.005; this.scaleY = 0.005; return; }
				if (Game.Scroll != 0 || (decay.prefs.touchpad && Game.keys[65])) {
					this.scaleX = 0.02;
					this.scaleY = 0.02;
				} else {
					this.scaleX = 0;
					this.scaleY = 0;
				}
			}
		});

		//mobile integration
		injectCSS(`.bottomRightContainer { position: absolute; right: 20px; bottom: 20px; z-index: 10000000000000000000000; display: none; flex-direction: row; justify-content: flex-end; align-items: flex-end; }`)
		injectCSS(`.bottomRightAC { width: 72px; height: 72px; padding: 4px; }`);
		injectCSS(`.bottomRightBox { display: flex; align-items: center; justify-content: center; }`);
		injectCSS(`.bottomRightBox:active { background: radial-gradient(circle at 50% 50%, #000, rgb(0, 0, 0)); box-shadow: 0px 0px 8px 3px rgba(3, 49, 44, 0.8); }`);
		injectCSS(`.bottomRightBox.enabled { background: radial-gradient(circle at 50% 50%, #000, rgb(0, 81, 73)); box-shadow: 0px 0px 8px 3px rgba(3, 49, 44, 0.8); }`);
		injectCSS(`.bottomRightPause { width: 60px; height: 60px; padding: 4px; margin-right: 10px; }`);

		addLoc('ENABLE AUTOCLICK');
		addLoc('Autoclicker only works when also pressing down on the big cookie or a wrinkler');
		addLoc('TOGGLE PAUSE');
		let autoClickerEle = document.createElement('div');
		autoClickerEle.id = 'bottomRightContainer';
		autoClickerEle.classList.add('bottomRightContainer');
		l('game').appendChild(autoClickerEle);
		decay.easyClicksEnable = false;
		autoClickerEle.innerHTML = '<div class="framed bottomRightBox bottomRightPause" style="" id="mobilePause"><span class="title" style="font-size: 14px; text-align: center;">'+loc('TOGGLE PAUSE')+'</span></div><div style="display: inline-block;"><div class="title" style="text-align: center; font-size: 10px; width: 90px;">'+loc('Autoclicker only works when also pressing down on the big cookie or a wrinkler')+'</div><div class="framed bottomRightBox bottomRightAC" id="mobileAC"><div style="background-image: url(\'./img/icons.png\'); width: 48px; height: 48px; transform: scale(1.1); '+writeIcon([0, 2])+'"></div><span style="position: absolute; text-align: center; font-size: 12px;" class="title">'+loc('ENABLE AUTOCLICK')+'</span></div></div>';
		AddEvent(l('mobileAC'), 'touchstart', function() { decay.easyClicksEnable = !decay.easyClicksEnable; if (decay.easyClicksEnable) { l('mobileAC').classList.add('enabled'); } else { l('mobileAC').classList.remove('enabled'); } });
		AddEvent(l('mobilePause'), 'touchstart', function() { kaizoCookies.togglePause(); if (kaizoCookies.paused) { l('mobilePause').classList.add('enabled'); } else { l('mobilePause').classList.remove('enabled'); } })
		if (Crumbs.mobile) { autoClickerEle.style.display = 'flex'; }
		
		//decay scaling
		decay.setRates = function() {
			let d = 0.99;
			d *= Math.pow(0.995, Game.log10CookiesSimulated);
			d *= Math.pow(0.9995, Math.max(Math.pow(decay.getBuildingContribution(), 0.33) - 10, 0));
			if (Game.Has('Legacy')) { d *= 0.98; }
			if (Game.Has('Lucky day')) { d *= 0.995; }
			if (Game.Has('Serendipity')) { d *= 0.995; }
			//if (Game.Has('Get lucky')) { d *= 0.995; }
			if (Game.Has('One mind')) { d *= 0.995; }
			//if (Game.Has('Shimmering veil')) { d *= 0.995; }
			if (Game.Has('Unshackled Purity')) { d *= 0.995; }
			if (Game.Has('Purification domes')) { d *= 0.995; }
			decay.incMult = Math.max(1 - d, 0.00001);
			
			decay.wcPow = 1;
			if (Game.hasGod) {
				let lvl = Game.hasGod('scorn');
				if (lvl == 1) { decay.wcPow = 1 / 0.5; }
				else if (lvl == 2) { decay.wcPow = 1 / 0.66; }
				else if (lvl == 3) { decay.wcPow = 1 / 0.8; }
			}

			decay.min = Math.min(1, 0.15 + (1 - d) * 3.5);

			//decay.brokenMult = 1 + Math.max(Game.log10Cookies / 120, 0);

			//decay.exhaustionBeginMult = 1 / (1 + Game.milkProgress / 50);
			decay.exhaustionBeginMult = 1;
			decay.exhaustionBeginMult *= 1 / Math.pow(Math.min(d + 0.03, 1), 7);

			let dh = 1;
			dh *= Math.max(1 / d, decay.haltDecMin);
			decay.decHalt = dh;

			decay.workProgressMult = 1;
			/*
			decay.workProgressMult *= 1 + Math.pow(Game.log10Cookies, 0.25) / 6;
			decay.workProgressMult *= 1 + Math.pow(Math.max(Game.log10Cookies - 18, 1), 0.5) / 12;
			decay.workProgressMult *= 1 + Math.pow(Math.max(Game.log10Cookies / 3 - 15, 1), 0.75) / 24;
			decay.workProgressMult *= 1 + Math.log2(decay.acceleration); 
			*/

			decay.buffDurPow = 0.5 - 0.15 * Game.auraMult('Epoch Manipulator');

			decay.purityToRequiredHaltPow = 0.7 - Game.Has('Stabilizing crystal') * 0.05;

			decay.wrinklersN = Crumbs.getObjects('w', 'left').length;

			decay.setOthers();
		}
		decay.getBuildingContribution = function() {
			//the bigger the building, the more "space" they take up, thus increasing decay by more
			let c = 0;
			let add = 0;
			if (Game.Has('Thousand fingers')) add +=    Math.log10(Game.BuildingsOwned + 1); 
			if (Game.Has('Million fingers')) add+=		0.6989700043360189; //log10(5)
			if (Game.Has('Billion fingers')) add+=		1; //log10(10)
			if (Game.Has('Trillion fingers')) add+=		1.3010299956639813; //log10(20)
			if (Game.Has('Quadrillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Quintillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Sextillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Septillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Octillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Nonillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Decillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Undecillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Unshackled cursors')) add+=	1.3979400086720377; //log10(25)
			c += add * Game.Objects['Cursor'].amount * 0.1;
			let grandmaPer = 0;
			if (Game.Has('One mind')) { grandmaPer += Game.Objects['Grandma'].amount / 100; }
			if (Game.Has('Communal brainsweep')) { grandmaPer += Game.Objects['Grandma'].amount / 100; }
			if (Game.Has('Elder Pact')) { grandmaPer += Game.Objects['Portal'].amount / 40; }
			c += grandmaPer + Game.Objects['Grandma'].amount;
			c += Game.Objects['Farm'].amount * 3 + Game.Objects['Mine'].amount * 3 + Game.Objects['Factory'].amount * 1.5 + Game.Objects['Bank'].amount * 1.25;
			c += Game.Objects['Temple'].amount * 1.25 + Game.Objects['Wizard tower'].amount + Game.Objects['Shipment'].amount + Game.Objects['Alchemy lab'].amount;
			c += Game.Objects['Portal'].amount * (1 + Game.Has('Deity-sized portals') * 1.5) + Game.Objects['Time machine'].amount;
			c += Game.Objects['Antimatter condenser'].amount * 2.5 + Game.Objects['Prism'].amount + Game.Objects['Chancemaker'].amount * 1.5;
			c += Game.Objects['Fractal engine'].amount * 2.71828 + Math.pow(Game.Objects['Javascript console'].amount, 1.2);
			c += Game.Objects['Idleverse'].amount * 7.5 + Game.Objects['Cortex baker'].amount * 6 + Game.Objects['You'].amount * 2;
			return c + 1;
		}
		Game.hasTriggeredDifficultyRampingNotif = 0;
		addLoc('Difficulty ramping has started!');
		decay.updateProgressKeypoints = function() {
			Game.log10Cookies = Math.log10(Game.cookiesEarned + 10);
			if (Game.resets == 0 || !decay.prefs.difficultyRamping || Game.OnAscend) { Game.log10CookiesSimulated = Game.log10Cookies; return; }

			const log10Max = Math.log10(Game.cookiesEarned + Game.cookiesReset);
			Game.log10CookiesSimulated = Math.max(Game.log10Cookies, Math.min(Math.max(Game.TCount - 60 * Math.pow(1 / log10Max, 0.5) * 60 * Game.fps, 0) / (100 * Math.pow(1 / log10Max, 0.5) * 60 * Game.fps), 1) * (log10Max - log10Max / 6));
			if (Game.log10CookiesSimulated > Game.log10Cookies) { 
				decay.triggerNotif('difficultyRamping');
				if (!Game.hasTriggeredDifficultyRampingNotif) { 
					Game.hasTriggeredDifficultyRampingNotif = 1;
					Game.Notify(loc('Difficulty ramping has started!'), '', 0, 1e20, false, true);
				}
			}
		}
		decay.setOthers = function() {
			decay.powerGainMult = decay.setPowerGainMult();
		}
		Game.registerHook('check', decay.setRates);
		Game.registerHook('reincarnate', decay.setRates);
		//make certain actions force a setRate
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].buy='+Game.Objects[i].buy.toString().replace('if (this.buyFunction) this.buyFunction();', 'if (this.buyFunction) { this.buyFunction(); } decay.setRates(); kaizoCookies.toCheckBuildingAchievements = 1;'));
		}
		//raw cps boosts
		decay.rawCpsMults = function(mult) {
			//mult *= (1 + 3 * Math.pow(1 - decay.incMult, 12));
			if (decay.challengeStatus('combo1')) { mult *= 1 + 9.09 / (Math.max(Game.log10Cookies - 10, 0) / 2 + 1); }
			if (Game.Has('Wrinkler ambergris')) { mult *= 1.06; }
			if (decay.covenantStatus('wrathBan')) { mult *= 0.02; }
			for (let i in Game.UpgradesByPool['tech']) {
				if (Game.Has(Game.UpgradesByPool['tech'][i].name)) { mult *= 1.02; }
			}
			if (Game.Has('Caramelized luxury')) { mult *= 1 + Math.min(Game.lumpsTotal * 0.05, 0.8 + 2.2 * Game.Has('High-fructose sugar lumps')); }
			mult *= decay.furnaceBoost;
			if (decay.challengeStatus('speedsac')) { mult *= 1 + 0.5 * Math.min(gap.convertTimes, 4); }
			return mult;
		}
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`var rawCookiesPs=Game.cookiesPs*mult;`, `mult = decay.rawCpsMults(mult); var rawCookiesPs=Game.cookiesPs*mult;`));
		Game.registerHook('cps', function(input) { Game.globalCpsMult *= decay.cpsPurityMults(); return input; });
		decay.multPerBuilding = function(what) {
			let m = decay.malachillaBoost(what) * decay.eldersiteBoost(what) * decay.rhodorangeBoost(what);
			if (Game.hasBuff('Rebound boost')) {
				let h = false;
				for (let i = Game.Objects[what].id + 1; i < Game.ObjectsById.length; i++) {
					if (Game.ObjectsById[i].amount > 0) { h = true; break; }
				}
				if (!h) { m *= 4; }
			}
			return m;
		}
		eval('Game.magicCpS='+Game.magicCpS.toString().replace('return 1;', 'return;').replace('return 1;', 'return decay.multPerBuilding(what);'));
		//the other actions are in their respective minigame sections

		//timer thingy omar made
		Game.AccurateSayTime=function(time,detail)
		{
			if (time<=0) return '';
			var str='';
			var detail=detail||0;
			time=Math.floor(time);
			if (detail==-1)
			{
				var days=0;
				var hours=0;
				var minutes=0;
				var seconds=0;
				if (time>=1000*60*60*24) days=(Math.floor(time/(1000*60*60*24)));
				if (time>=1000*60*60) hours=(Math.floor(time/(1000*60*60)));
				if (time>=1000*60) minutes=(Math.floor(time/(1000*60)));
				if (time>=1000) seconds=(Math.floor(time/1000));
				hours-=days*24;
				minutes-=hours*60+days*24*60;
				seconds-=minutes*60+hours*60*60+days*24*60*60;
				var bits=[];
				if (time>=1000*60*60*24) bits.push(Beautify(days));
				if (time>=1000*60*60) bits.push(("0"+Beautify(hours)).slice(-2));
				if (time>=1000*60) bits.push(("0"+Beautify(minutes)).slice(-2));
				if (time>=1000) bits.push(("0"+Beautify(seconds)).slice(-2));
				bits.push(("00"+Beautify(time%1000)).slice(-3));
				str=bits.join(':');
			}
			return str;
		}
	
        l('CrumbsEngineVersion').insertAdjacentHTML('beforebegin','<div class="title" style="font-size:25px;" id="Timer"></div>');
		l('CrumbsEngineVersion').insertAdjacentHTML('beforebegin','<div class="title" style="font-size:25px;" id="Timer2"></div>');
	
		Game.registerHook('draw', () => {
		    var date=new Date();
		    date.setTime(Date.now()-Game.startDate);
		    var timeInMiliseconds=date.getTime();
		    var startDate=Game.AccurateSayTime(timeInMiliseconds,-1);
			date.setTime(Date.now()-Game.fullDate);
			var fullDate=Game.AccurateSayTime(date.getTime(),-1);
			if (!fullDate || fullDate.length<1) fullDate='a long while';
			if (decay.prefs.RunTimer){
				l('Timer').innerHTML = '<b>'+'</b>'+(startDate);
			}
			if (decay.prefs.LegacyTimer){
				l('Timer2').innerHTML = '<b>'+'</b>'+(fullDate);
			}		
	    });

		allValues('decay ui and scaling');

		//decay visuals
		decay.cookiesPsAnim = function() {
			if (!decay.unlocked) { return ''; }
			var colors = [];
			var sec = Game.fps;
			if (decay.times.sinceLastPurify < 3 * sec) {
				var frac = Math.pow(decay.times.sinceLastPurify / (3 * sec), 0.7);
				colors.push(colorCycleFrame([51, 255, 68], [51, 255, 68, 0], frac));
			}
			if (Game.pledgeT > 0) {
				var frame = Math.floor(Game.pledgeT / (2 * sec)) + Math.pow((Game.pledgeT / (2 * sec)) - Math.floor(Game.pledgeT / (2 * sec)), 0.5);
				if (Math.floor(frame) % 2) { 
					colors.push(colorCycleFrame([51, 255, 68], [42, 255, 225], (frame - Math.floor(frame)))); 
				} else {
					colors.push(colorCycleFrame([42, 255, 225], [51, 255, 68], (frame - Math.floor(frame)))); 
				}
			}
			if (decay.times.sincePledgeEnd < 3 * sec) {
				var frac = Math.pow(decay.times.sincePledgeEnd / (3 * sec), 1.5);
				colors.push(colorCycleFrame([51, 255, 68], [51, 255, 68, 0], frac));
			}
			if (decay.times.sinceLastAmplify < 5 * sec) {
				var frac = Math.pow(decay.times.sinceLastAmplify / (3 * sec), 1.5);
				colors.push(colorCycleFrame([119, 30, 143], [119, 30, 143, 0], frac));
			}
			if (Game.veilOn() && Game.cpsSucked == 0) {
				var frame = Math.floor(Game.T / (10 * sec)) + Math.pow((Game.T / (10 * sec)) - Math.floor(Game.T / (10 * sec)), 0.33);
				if (Math.floor(frame) % 2) { 
					colors.push(colorCycleFrame([255, 236, 69, 0], [255, 236, 69, 0.66], (frame - Math.floor(frame)))); 
				} else {
					colors.push(colorCycleFrame([255, 236, 69, 0.66], [255, 236, 69, 0], (frame - Math.floor(frame)))); 
				}
			}
			var result = avgColors(colors, true);
			if (result[3] < 1) {
				if (Game.cpsSucked == 0) {
					result = avgColors([result, [255, 255, 255, 1 - result[3]]], false);
				} else {
					result = avgColors([result, [255, 0, 0, 1 - result[3]]], false);
				}
			}
			if (colors.length > 0) {
				return 'color: rgb('+result[0]+','+result[1]+','+result[2]+');';
			} else {
				return '';
			}
		}
		eval('Game.Draw='+Game.Draw.toString().replace(`class="wrinkled"':'')+'>'`, `class="wrinkled"':'')+' style="'+decay.cookiesPsAnim()+'">'`));
		decay.conditionalAnim = function() {
			if (!decay.currentConditional) { return; }
			var frame = Game.T / (2 * Game.fps);
			var colors = [];
			if (Math.floor(frame) % 2) {
				colors = colorCycleFrame([190, 0, 0, 0.44], [190, 0, 106, 0.44], frame - Math.floor(frame));
			} else {
				colors = colorCycleFrame([190, 0, 106, 0.44], [190, 0, 0, 0.44], frame - Math.floor(frame));
			}
			if (l('activeConditional')) { l('activeConditional').style.backgroundColor = ' rgba('+colors[0]+','+colors[1]+','+colors[2]+','+colors[3]+')'; }
		}
		Game.registerHook('draw', decay.conditionalAnim);

		decay.buildCpsWithoutDecay = {};
		for (let i in Game.Objects) {
			decay.buildCpsWithoutDecay[i] = Game.Objects[i].cps.toString().replaceAll('this.name', '"'+i+'"'); //CCSE support
			decay.buildCpsWithoutDecay[i] = eval('decay.buildCpsWithoutDecay["'+i+'"]='+decay.buildCpsWithoutDecay[i]);
			eval('Game.Objects["'+i+'"].cps='+Game.Objects[i].cps.toString().replace('CpsMult(me);', 'CpsMult(me); mult *= decay.get(me.id); '));
		}
		decay.onBuildingBuy = function(me) {
			//return true = building buy cancelled
			if (Game.ascensionMode == 42069) { 
				if (me.id % 2 == 0) { decay.challenges.buildingsAlternate.makeCannotComplete(); }
			}
		}
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`{Game.cookiesPs+=9;Game.cookiesPsByType['"egg"']=9;}`,`{Game.cookiesPs+=9*decay.gen;Game.cookiesPsByType['"egg"']=9*decay.gen;}`));
		eval("Game.shimmerTypes['golden'].initFunc="+Game.shimmerTypes['golden'].initFunc.toString()
			 .replace(' || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3)', ' || ((Math.random() > Math.pow(decay.gen, decay.wcPow * Game.eff("wrathReplace"))))')
			 .replace('var dur=13;', 'var dur=13; if (false) { dur = 2; me.wrathTrapBoosted = true; } else { me.wrathTrapBoosted = false; } if (decay.covenantStatus("frenzyStack")) { me.canBoostFrenzy = true; } else { me.canBoostFrenzy = false; } if (decay.covenantStatus("dragonStack")) { me.canBoostDH = true; } else { me.canBoostDH = false; }')
		);
		addLoc('+%1/min');

		//UI changes (brought from 1.0501)
		l("sectionRight").style["background"] = "url(img/panelBG.png)";

		Game.GiveUpAscend=function(bypass)
		{
			if (!bypass) Game.Prompt('<h3>Give up</h3><div class="block">Are you sure? You\'ll have to start this run over and won\'t gain any heavenly chips!</div>',[['Yes','Game.ClosePrompt();Game.GiveUpAscend(1);'],'No']);
			else {
				if (Game.prefs.popups) Game.Popup('Game reset');
				else Game.Notify('Gave up','Let\'s try this again!',[0,5],4);
				let ch = decay.currentConditional;
				Game.Reset();
				decay.onAscending();
				decay.onReincarnation();
				decay.currentConditional = ch;
			}
		}

		addLoc('Ascending in...');
		Game.ShowLegacy=function()
		{
			var str='<h3>Legacy</h3>';
			str+='<div class="block" id="legacyPromptData" style="overflow:hidden;position:relative;text-align:center;"></div>';
			str+='<a class="option" style="position:absolute;right:4px;bottom:4px;" '+Game.clickStr+'="Game.ClosePrompt();Game.GiveUpAscend();" '+Game.getTooltip(
							'<div style="min-width:200px;text-align:center;">Abandon the current run; you will not ascend, you will lose your current progress, but you will keep anything ascending normally keeps.</div>'
							,'bottom-right')+
				'>Give up</a>';
			Game.Prompt(str,[['Ascend','Game.ClosePrompt();if (decay.broken == 1 || Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned))-Math.floor(Game.HowMuchPrestige(Game.cookiesReset)) < 1) { Game.Ascend(1); } else { decay.ascendIn = 75 * Game.fps; Game.Notify(loc("Ascending in..."), "", 0); }'],'br','Cancel'],Game.UpdateLegacyPrompt,'legacyPrompt');
			l('promptOption0').className='option framed large title';
			l('promptOption0').style='margin:16px;padding:8px 16px;animation:rainbowCycle 5s infinite ease-in-out,pucker 0.2s ease-out;box-shadow:0px 0px 0px 1px #000,0px 0px 1px 2px currentcolor;background:linear-gradient(to bottom,transparent 0%,currentColor 500%);width:auto;text-align:center;';
			l('promptOption0').style.display='none';
			
			setTimeout(function() { l('promptOption0').style.display='inline-block'; Game.UpdateLegacyPrompt(); }, 6 / Game.fps * 1000);
		}

		addLoc('Due to the fact that <b>decay has progressed past its breaking point</b>, it will take an additional <b>%1</b> for the ascend animation to start! You can cancel the ascension countdown at any time using the esc key.');
		Game.UpdateLegacyPrompt=function()
		{
			if (!l('legacyPromptData')) return 0;
			l('legacyPromptData').innerHTML=
				'<div class="icon" style="pointer-event:none;transform:scale(2);opacity:0.25;position:absolute;right:-8px;bottom:-8px;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
                loc("Do you REALLY want to ascend?<div class=\"line\"></div>You will lose your progress and start over from scratch.<div class=\"line\"></div>All your cookies will be converted into prestige and heavenly chips.")+'<div class="line"></div>'+(Game.canLumps()?loc("You will keep your achievements, building levels and sugar lumps."):loc("You will keep your achievements."))+
				'<div class="line"></div>'+((decay.broken>1 && Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned))-Math.floor(Game.HowMuchPrestige(Game.cookiesReset)) > 0)?('<div class="listing">'+loc('Due to the fact that <b>decay has progressed past its breaking point</b>, it will take an additional <b>%1</b> for the ascend animation to start! You can cancel the ascension countdown at any time using the esc key.', Game.sayTime(75 * Game.fps, -1))+'</div>'):'');
		}

		Game.Ascend = function(bypass) {
			if (!bypass) Game.ShowLegacy();
			else
			{
				Game.Notify(loc("Ascending"),loc("So long, cookies."),[20,7],4);
				Game.OnAscend=0;Game.removeClass('ascending');
				Game.addClass('ascendIntro');
				//trigger the ascend animation
				Game.AscendTimer=1; Crumbs.killAllFallingCookies();
				Game.killShimmers();
				l('toggleBox').style.display='none';
				l('toggleBox').innerHTML='';
				Game.choiceSelectorOn=-1;
				Game.ToggleSpecialMenu(0);
				Game.AscendOffX=0;
				Game.AscendOffY=0;
				Game.AscendOffXT=0;
				Game.AscendOffYT=0;
				Game.AscendZoomT=1;
				Game.AscendZoom=0.2;
				
				Game.jukebox.reset();
				decay.onAscending();
				PlayCue('preascend');
			}
			
		}

		eval('Game.Reincarnate=' + Game.Reincarnate.toString().replace(`if (!bypass) Game.Prompt('<id Reincarnate><h3>'+loc("Reincarnate")+'</h3><div class="block">'+loc("Are you ready to return to the mortal world?")+'</div>',[[loc("Yes"),'Game.ClosePrompt();Game.Reincarnate(1);'],loc("No")]);`, `if (!bypass) Game.Prompt('<id Reincarnate><h3>'+loc("Reincarnate")+'</h3><div class="block">'+'<div class="icon" style="pointer-event:none;transform:scale(2);opacity:0.50;position:absolute;right:-8px;bottom:-8px;background-position:'+(-10*48)+'px '+(-0*48)+'px;"></div>'+loc("Are you ready to return to the mortal world?")+'</div>',[[loc("Yes"),'Game.ClosePrompt();Game.Reincarnate(1);'],loc("No")]);`));

		//new game minus
		decay.cookiesTotalNGM = Game.cookiesReset + Game.cookiesEarned;
		decay.goldenClicksTotalNGM = Game.goldenClicks;
		decay.trueStartDate = Game.startDate;
		decay.cookieClicksTotalNGM = Game.cookieClicks;
		decay.lumpsTotalNGM = Math.max(Game.lumpsTotal, 0);
		//decay.spellsCastTotalNGM
		//decay.harvestsTotalNGM
		eval('Game.Earn='+Game.Earn.toString().replace(';', '; decay.cookiesTotalNGM += howmuch;'));
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace('Game.goldenClicksLocal++;', 'Game.goldenClicksLocal++; decay.goldenClicksTotalNGM++;'));
		Game.registerHook('click', function() { decay.cookieClicksTotalNGM++; });
		eval('Game.gainLumps='+Game.gainLumps.toString().replace('Game.lumpsTotal+=total;', 'Game.lumpsTotal+=total; decay.lumpsTotalNGM += total;'));
		decay.NGMResets = 0;
		decay.NGMState = 0;
		//exclusively to be used to level up NGM
		decay.NGMReset = function() {
			let [a, b, c, d, e, f, g] = [decay.cookiesTotalNGM, decay.goldenClicksTotalNGM, decay.trueStartDate, decay.cookieClicksTotalNGM, decay.lumpsTotalNGM, decay.spellsCastTotalNGM, decay.harvestsTotalNGM];
			if (decay.NGMResets > 0 && decay.NGMState == 0) { decay.NGMState = decay.NGMResets; }
			else if (decay.NGMState == decay.NGMResets) { decay.NGMState++; decay.NGMResets++; }
			let state = decay.NGMState;
			let resets = decay.NGMResets;
			
			Game.HardReset(2);

			decay.NGMState = state;
			decay.NGMResets = resets;
			decay.cookiesTotalNGM = a;
			decay.goldenClicksTotalNGM = b;
			decay.trueStartDate = c;
			decay.cookieClicksTotalNGM = d;
			decay.lumpsTotalNGM = e;
			if (isv(f)) { decay.spellsCastTotalNGM = f; }
			if (isv(g)) { decay.harvestsTotalNGM = g; }
			Game.Notify('New game minus', 'Difficulty heightened!<br>You can disable the effects of New game minus at any time for the rest of the legacy using the options menu.', [15, 5]); 
			
		}
		decay.saveNGMInfo = function() {
			let str = '';
			str += decay.NGMState + ',';
			str += decay.NGMResets + ',';
			str += decay.cookiesTotalNGM + ',';
			str += decay.goldenClicksTotalNGM + ',';
			str += decay.trueStartDate + ',';
			str += decay.cookieClicksTotalNGM + ',';
			str += decay.lumpsTotalNGM + ',';
			str += decay.spellsCastTotalNGM + ',';
			str += decay.harvestsTotalNGM;

			return str;
		}
		decay.loadNGMInfo = function(str) {
			if (!isv(str)) { return; }
			let info = str.split(',');
			for (let i in info) { info[i] = parseFloat(info[i]); }

			decay.NGMState = info.shift();
			decay.NGMResets = info.shift();
			decay.cookiesTotalNGM = info.shift();
			decay.goldenClicksTotalNGM = info.shift();
			decay.trueStartDate = info.shift();
			decay.cookieClicksTotalNGM = info.shift();
			decay.lumpsTotalNGM = info.shift();
			decay.spellsCastTotalNGM = info.shift();
			decay.harvestsTotalNGM = info.shift();
		}
		addLoc('New game minus');
		addLoc('Do you REALLY want to start a new New game minus legacy?<br><small>You will lose your progress, your achievements, and your heavenly chips, start over with <b>increased difficulty</b>, and <b>without gaining any benefits</b>!</small>');
		addLoc('Are you REALLY, <b>REALLY</b>, sure about this? The game will get harder, you will gain <b>NO</b> benefits or boosts, and while you can disable the negative effects of New game minus at any time - you won\'t get your current progress back!<br><small>Don\'t say we didn\'t warn you!</small>');
		addLoc('Are you ready to return to where you left off?<br>Last time you were in New game minus, you were <b>%1</b> layers deep.');
		addLoc('This will wipe your current progress, including all of your prestige!');
		decay.askNGMReset = function(stage) {
			if (decay.NGMResets > 0 && decay.NGMState == 0) {
				if (stage == 0) {
					Game.Prompt('<id NGMRestore><h3>'+loc('New game minus')+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc('Are you ready to return to where you left off?<br>Last time you were in New game minus, you were <b>%1</b> layers deep.', Beautify(decay.NGMResets))+'<br>'+loc('This will wipe your current progress, including all of your prestige!'),[[EN?'Yes!':loc("Yes"),'Game.ClosePrompt();decay.askNGMReset(1);','float:left'],[loc("No"),0,'float:right']]);
				}
				else if (stage == 1) { decay.NGMReset(); }
				return;
			}
			if (stage == 0) {
				Game.Prompt('<id NGMReset><h3>'+loc('New game minus')+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc("Do you REALLY want to start a new New game minus legacy?<br><small>You will lose your progress, your achievements, and your heavenly chips, start over with <b>increased difficulty</b>, and <b>without gaining any benefits</b>!</small>")+'</div>',[[EN?'Yes!':loc("Yes"),'Game.ClosePrompt();decay.askNGMReset(1);','float:left'],[loc("No"),0,'float:right']]);
			}
			else if (stage == 1) {
				Game.Prompt('<id NGMReset><h3>'+loc('New game minus')+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc('Are you REALLY, <b>REALLY</b>, sure about this? The game will get harder, you will gain <b>NO</b> benefits or boosts, and while you can disable the negative effects of New game minus at any time - you won\'t get your current progress back!<br><small>Don\'t say we didn\'t warn you!</small>'),[[EN?'Do it!':loc("Yes"),'Game.ClosePrompt();decay.askNGMReset(2);','float:left'],[loc("No"),0,'float:right']]);
			}
			else if (stage == 2) { decay.NGMReset(); }
		}
		decay.revertNGM = function() {
			decay.NGMState = 0;
			Game.Notify('New game minus disabled!', '', 0);
			Game.UpdateMenu();
		}
		addLoc('Exit New game minus');
		addLoc('Are you sure? You can reactivate New game minus at any time, but doing so will wipe your progress again.');
		decay.askNGMRevert = function(stage) {
			if (decay.NGMState == 0) { return; }
			Game.Prompt('<id NGMRevert><h3>'+loc('Exit New game minus')+'</h3><div class="block">'+loc('Are you sure? You can reactivate New game minus at any time, but doing so will wipe your progress again.')+'</div>', [[loc("Yes"),'Game.ClosePrompt();decay.revertNGM();',''],[loc("No"),0]]);
		}
		Game.getNormalAchievsN = function() {
			let c = 0;
			for (let i in Game.Achievements) {
				if (Game.Achievements[i].pool == 'normal') { c++; }
			}
			return c;
		}
		Game.normalAchievsN = Game.getNormalAchievsN();
		new Game.Upgrade('New game minus', '', 0, [15, 5], function() {
			if (decay.NGMResets > 0 && decay.NGMState == 0) {
				decay.askNGMReset(0);
			} else {
				let completions = Game.AchievementsOwned / Game.normalAchievsN;
				let threshold = decay.NGMAchievReqMap[decay.NGMState]; 
				if (decay.NGMState > decay.NGMAchievReqMap.max) { threshold = decay.NGMAchievReqMap[decay.NGMAchievReqMap.max]; }
				if (completions >= threshold) { decay.askNGMReset(0); }
			}
			Game.Upgrades['New game minus'].bought = 0;
		}); Game.last.pool = 'toggle'; Game.last.order = 100000;
		decay.NGMAchievReqMap = {
			0: 0.85,
			1: 0.9,
			2: 0.92,
			3: 0.94,
			4: 0.96,
			5: 0.97,
			6: 0.98,
			max: 6
		}
		decay.NGMCookiesReq = 1e63;
		addLoc('Resets <b>everything</b> and adds one New game minus layer, starting a new legacy with stronger decay than before. In addition, breaking point will be present in the first ascension as well.<br>Only unlocked upon obtaining at least <b>%1</b>, and advancing a layer requires achievement completions to be complete.');
		addLoc('Reset <b>everything</b> and return to <b>layer %1</b> of New game minus.');
		addLoc('Unlocked upon obtaining an achievement completion of at least <b>%1%</b>.');
		addLoc('Next layer: <b>layer %1</b>');
		Game.last.descFunc = function() {
			if (decay.NGMResets > 0 && decay.NGMState == 0) {
				return loc('Reset <b>everything</b> and return to <b>layer %1</b> of New game minus.', decay.NGMResets);
			}
			let completions = Game.AchievementsOwned / Game.normalAchievsN;
			let threshold = decay.NGMAchievReqMap[decay.NGMState]; 
			if (decay.NGMState > decay.NGMAchievReqMap.max) { threshold = decay.NGMAchievReqMap[decay.NGMAchievReqMap.max]; }
			return '<div style="text-align:center;"><b>'+((completions>=threshold)?loc('Unlocked'):loc('Locked'))+'</b><br><small>'+loc('Unlocked upon obtaining an achievement completion of at least <b>%1%</b>.', Beautify(threshold * 100))+'</small><br>'+loc('Next layer: <b>layer %1</b>', Beautify(decay.NGMResets + 1))+'</div><div class="line"></div>'+loc('Resets <b>everything</b> and adds one New game minus layer, starting a new legacy with stronger decay than before. In addition, breaking point will be present in the first ascension as well.<br>Only unlocked upon obtaining at least <b>%1</b>, and advancing a layer requires achievement completions to be complete.', Beautify(decay.NGMCookiesReq))+'<q>Endless content, forever.</q>';
		}
		Game.registerHook('check', function() { if (Game.cookiesEarned + Game.cookiesReset > decay.NGMCookiesReq || (decay.NGMResets > 0 && decay.NGMState == 0)) { Game.Unlock('New game minus'); } });
		addLoc('Cookies baked (cross-legacies total):');
		addLoc('First legacy started:');
		addLoc(', with %1 new game minus layer%2');
		addLoc('cross-legacies total: ');
		addLoc('Sugar lumps harvested across all legacies:');
		addLoc('Disables New game minus and reverts all of its effects for this legacy and all future legacies, until New game minus is invoked again');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
			 .replace(`Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+`, `Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+(decay.cookiesTotalNGM==(Game.cookiesEarned+Game.cookiesReset)?'':('<div class="listing"><b>'+loc("Cookies baked (cross-legacies total):")+'</b> <div class="price plain">'+Game.tinyCookie()+Beautify(decay.cookiesTotalNGM)+'</div></div>'))+`)
			 .replace(`(Game.resets?('<div`, `(decay.NGMResets?('<div class="listing"><b>'+loc("First legacy started:")+'</b> '+(loc('%1 ago', Game.sayTime((Date.now() - decay.trueStartDate) / 1000 * Game.fps))))+loc(', with %1 new game minus layer%2', [decay.NGMResets, ((decay.NGMResets==1||(!EN))?'':'s')])+'</div>':'')+(Game.resets?('<div`)
			 .replace(`+loc("all time:")+' '+Beautify(Game.goldenClicks)+`, `+loc("all time:")+' '+Beautify(Game.goldenClicks)+(decay.goldenClicksTotalNGM==Game.goldenClicks?'':('; '+loc('cross-legacies total: ')+Beautify(decay.goldenClicksTotalNGM)))+`)
			 .replace(`Beautify(Game.lumpsTotal)+'</div></div>'`, `Beautify(Game.lumpsTotal)+'</div></div>'+(decay.lumpsTotalNGM==Game.lumpsTotal?'':('<div class="listing"><b>'+loc("Sugar lumps harvested across all legacies:")+'</b> <div class="price lump plain">'+Beautify(decay.lumpsTotalNGM)+'</div></div>'))`)
			 .replace(`eep backups on your computer")+'</label></div>'):'')+`, `eep backups on your computer")+'</label></div>'):'')+(decay.NGMState==0?'':'<br><div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="decay.askNGMRevert();Game.UpdateMenu();">'+loc('Exit New game minus')+'</a><label>'+loc('Disables New game minus and reverts all of its effects for this legacy and all future legacies, until New game minus is invoked again')+'</label></div><br>')+`)
			);
		
		/*=====================================================================================
        Wrinklers
        =======================================================================================*/
		decay.wrinklerSpawnRate = 0;
		decay.wrinklerApproach = 0.0001;
		decay.wrinklerResistance = 0.75;
		decay.wrinklerRegen = 0.02;
		decay.wrinklerLossMult = 1;
		Crumbs.initWrinklers = function() {
			for (let i = 0; i < Game.wrinklerLimit; i++) {
				let w = Crumbs.findObject('wrinkler'+i, 'left');
				if (w !== null) { w.die(); }
			}
		};
		Crumbs.initWrinklers();
		Game.rebuildWrinklers = function(absMax) {
			Game.wrinklerLimit = absMax;
			Game.wrinklers=[];
			for (var i=0;i<Game.wrinklerLimit;i++) {
				Game.wrinklers.push({id:parseInt(i),close:0,sucked:0,phase:0,x:0,y:0,r:0,hurt:0,hp:Game.wrinklerHP,selected:0,type:0,clicks:0});
			}
		};
		Game.rebuildWrinklers(2);
		decay.lumpCarriersCount = 0;
		decay.lumpCarriersList = [];
		decay.setWrinklerApproach = function() {
			let base = 45 / Game.eff('wrinklerApproach'); //the bigger the number here, the slower it approaches
			let mult = 1;
			if (Game.Has('Wrinklerspawn')) { mult *= 1 / 0.95; }
			if (Game.Has('Mangled cookies')) { mult *= 1 / 0.95; }
			if (Game.hasGod) {
				const godLvl = Game.hasGod('scorn');
				if (godLvl == 1) { mult *= 1/0.7; }
				else if (godLvl == 2) { mult *= 1/0.8; }
				else if (godLvl == 3) { mult *= 1/0.9; }
			}
			if (decay.challengeStatus('buildingsAlternate')) { mult *= 1 / 0.9; }
			if (decay.challengeStatus('veil')) { mult *= 1 / 0.9; }
			if (decay.challengeStatus('comboGSwitch')) { mult *= 1 / 0.9; }
			if (decay.isConditional('knockbackTutorial')) { mult *= 1 / 3; }
			if (Game.hasBuff('Sugar boost')) { mult *= 1 / 6; }
			return Math.min(Math.sqrt(Game.log10CookiesSimulated + 20), (Game.Has('Legacy')?10:3)) * 0.00125 * (1 / mult) + 
			(Game.resets > 0?(1 / Math.max(5, base * mult / (Math.log(1 / Math.min(1, Math.pow(Math.max(Math.min(decay.gen, (1 / (1 + Math.max(Math.min(Game.log10CookiesSimulated - 33, 30), 0) / 3))), decay.breakingPoint), decay.wrinklerApproachPow))) / Math.log(decay.wrinklerApproachFactor)))):0);
		};
		decay.recalculateLumpCarriers = function() {
			const allWrinklers = Crumbs.getObjects('w');
			let count = 0;
			let list = [];
			for (let i in allWrinklers) {
				if (allWrinklers[i].lumpCarrying) { count++; list.push(allWrinklers[i]); }
			}
			decay.lumpCarriersCount = count;
			decay.lumpCarriersList = list;
			return count;
		}
		decay.wrinklerSpawnRateMap = { 
			//all values below are log10 of cookie count
			//starts out high, gradually diminishes over time
			//strictly order from low to high
			0: 0,
			3: 0.01,
			5: 0.015,
			7: 0.02,
			12: 0.0225,
			21: 0.02,
			27: 0.015,
			48: 0.01,
			309: 0.005
		}
		decay.wrinklerSpawnRateMapFirstAscend = { 
			0: 0,
			12: 0.015,
			24: 0.02,
			48: 0.04,
			309: 0.08
		}
		decay.wrinklerSpawnRateMap[-1] = 0;
		decay.wrinklerSpawnRateMapKeys = Object.keys(decay.wrinklerSpawnRateMap);
		decay.wrinklerSpawnRateMapFirstAscend[-1] = 0;
		decay.wrinklerSpawnRateMapFirstAscendKeys = Object.keys(decay.wrinklerSpawnRateMapFirstAscend);
		decay.setWrinklerSpawnRate = function() {
			if (Game.cookiesEarned < decay.featureUnlockThresholds.wrinklers || Game.Has("Wrinkler doormat") || Game.hasBuff('Pure suppression')) { return 0; }
			let base = 0;
			const map = (Game.resets > 1?decay.wrinklerSpawnRateMap:decay.wrinklerSpawnRateMapFirstAscend);
			const keys = (Game.resets > 1?decay.wrinklerSpawnRateMapKeys:decay.wrinklerSpawnRateMapFirstAscendKeys);
			for (let i = 0; i < keys.length; i++) {
				if (keys[i] <= Game.log10CookiesSimulated) {
					continue;
				}
				//smooth interpolation
				const upper = map[keys[i]];
				const lower = map[keys[i - 1]];
				const diff = keys[i] - keys[i - 1];
				base = 1 - (upper * (diff - (keys[i] - Game.log10CookiesSimulated)) / diff + lower * (diff - (Game.log10CookiesSimulated - keys[i - 1])) / diff);
				//console.log(base);
				break;
			}

			let mult = 1;
			if (decay.isConditional('powerClickWrinklers')) { mult *= 2.5; }
			if (decay.gen > 1) { mult *= Math.pow(decay.gen, 0.2); }
			if (Game.hasBuff('Trick or treat')) { mult *= Game.hasBuff('Trick or treat').power; }
			return 1 - Math.pow(base, mult);
		};
		decay.setWrinklerResistance = function() {
			//the amount of health decrease per click
			let base = 0.75;
			let fingerMult = 1;
			for (let i in decay.multiFingers) {
				if (decay.multiFingers[i].bought) { fingerMult += 0.15; }
			}
			base *= fingerMult;
			if (decay.challengeStatus('wrinkler1')) { base *= 1.15; }
			if (Game.Has('Santaic doom')) { 
				base *= 1 + Math.max(Game.santaLevel - 7, 0) * 0.01;
			}
			if (Game.Has('Unholy bait')) { base *= 1.1; }
			if (Game.Has('Mangled cookies')) { base *= 1.05; }
			if (decay.isConditional('powerClickWrinklers')) { base *= 0.5; }
			if (decay.isConditional('reindeer')) { base *= 1.4; }
			if (Game.hasBuff('Counter strike')) { base *= 1.75; }
			base *= 1 / (1 + Math.max(Game.log10CookiesSimulated - 18, 0) / 30);
			base *= Math.pow(0.9, decay.lumpCarriersCount);
			return base;
		};
		decay.setWrinklerRegen = function() {
			//per frame
			let r = 0;
			return r;
		};
		decay.setWrinklerMaxHP = function() {
			let h = 12.6 * Math.pow(1 - decay.incMult, 4.5);
			if (Game.Has('Unholy bait')) { h *= 0.9; }
			return h;
		};
		decay.setWrinklerLossMult = function() {
			let m = 1;
			if (Game.Has('Sacrilegious corruption')) { m *= 0.8; } //funny easter egg from a bygone time
			return m;
		};
		decay.setWrinklersAll = function() {
			decay.wrinklerSpawnRate = decay.setWrinklerSpawnRate();
			decay.wrinklerApproach = decay.setWrinklerApproach();
			decay.wrinklerResistance = decay.setWrinklerResistance();
			decay.wrinklerRegen = decay.setWrinklerRegen();
			Game.wrinklerHP = decay.setWrinklerMaxHP();
		};
		addLoc('%1 to exploding');
		addLoc('In never');
		addLoc('In %1');
		addLoc('Eating...');
		decay.shortTimeDisplay = function(frames) {
			let str = Math.floor(frames % Game.fps / (Game.fps / 10));
			const h1 = Math.floor(frames % (60 * Game.fps) / Game.fps);
			const h2 = Math.floor(frames % (Game.fps * 3600) / (Game.fps * 60));
			const h3 = Math.floor(frames / (Game.fps * 3600));
			str = (h2 ? (h1 >= 10 ? h1 : ('0' + h1)) : h1) + '.' + str;
			if (h2) { str = (h3 ? (h2 >= 10 ? h2 : ('0' + h2)) : h2) + ':' + str; }
			if (h3) { str = (h3 >= 10 ? h3 : ('0' + h3)) + ':' + str; }

			return str;
		}
		Crumbs.drawEyeOfTheWrinkler = function(m, ctx) {
			//lazy lazy lazy lazy lazy
			if (!m.targetComponent?.hovered || !m.targetComponent?.enabled) { return; }
			let text = '';
			if (m.distDisplay) {
				text = (m.frames>0?loc('In %1', decay.shortTimeDisplay(m.frames)):loc('In never'));
			} else if (m.bomber) {
				text = loc('%1 to exploding', Beautify(m.explosionProgress * 100, 2) + '%');
			} else {
				text = loc('Eating...');
			}

			var x=Game.cookieOriginX;
			var y=Game.cookieOriginY;
			ctx.font='16px Merriweather';
			ctx.textAlign='center';
			var width=Math.ceil(ctx.measureText(text).width) + 4;
			ctx.fillStyle='#000';
			ctx.globalAlpha=0.65;
			var xO=x-width/2-16;
			var yO=y-4;
			var dist=Math.floor(Math.sqrt((m.targetX-xO)*(m.targetX-xO)+(m.targetY-yO)*(m.targetY-yO)));
			var angle=-Math.atan2(yO-m.targetY,xO-m.targetX)+Math.PI/2;
			ctx.strokeStyle='#fff';
			ctx.lineWidth=1;
			for (var i=0;i<Math.floor(dist/12);i++)
			{
				var xC=m.targetX+Math.sin(angle)*i*12;
				var yC=m.targetY+Math.cos(angle)*i*12;
				ctx.beginPath();
				ctx.arc(xC,yC,4+(Game.prefs.fancy?2*Math.pow(Math.sin(-Game.T*0.2+i*0.3),4):0),0,2*Math.PI,false);
				ctx.fill();
				ctx.stroke();
			}
			ctx.fillRect(x-width/2-8-10,y-23,width+16+20,38);
			ctx.strokeStyle='#fff';
			ctx.lineWidth=1;
			ctx.strokeRect(x-width/2-8-10+1.5,y-23+1.5,width+16+20-3,38-3);
			ctx.globalAlpha=1;
			ctx.fillStyle='#fff';
			ctx.fillText(text,x+10,y+1);
			var s=54+2*Math.sin(Game.T*0.4);
			ctx.drawImage(Pic('icons.png'),27*48,26*48,48,48,x-width/2-16-s/2,y-4-s/2,s,s);
		}
		decay.EOTWObj = Crumbs.findObject('eyeOfTheWrinkler', 'left');
		decay.EOTWObj.getComponent('canvasManipulator').function = Crumbs.drawEyeOfTheWrinkler;
		replaceDesc('Eye of the wrinkler', 'Mouse over a wrinkler to see how long it would take for it to reach the big cookie or its progress to exploding.', true);
		Game.Upgrades['Eye of the wrinkler'].basePrice = 1000;
		Game.Upgrades['Eye of the wrinkler'].parents = [Game.Upgrades['Twin Gates of Transcendence']];
		Game.Upgrades['Eye of the wrinkler'].posX = Game.Upgrades['Twin Gates of Transcendence'].posX;
		Game.Upgrades['Eye of the wrinkler'].posY = Game.Upgrades['Twin Gates of Transcendence'].posY - 240;
		Game.Upgrades['Synergies Vol. I'].parents.push(Game.Upgrades['Eye of the wrinkler']);
		decay.wrinklersN = 0;
		decay.lastWrinklerClick = Date.now();
		decay.lastWrinklerScroll = Date.now();
		decay.wrinklerMovement = new Crumbs.behavior(function() {
			if (this.dead) { return; }
			this.scaleX = (this.size * 0.2 + 0.4) * (1+0.02*Math.sin(Game.T*0.2+Number(this.index)*2));
			this.scaleY = (this.size * 0.2 + 0.4) * (1+0.025*Math.sin(Game.T*0.2-2+Number(this.index)*2));

			const pos = Crumbs.h.rv(this.rad, 0, 116 + this.dist * 72); //108 pixels
			this.x = this.leftSection.offsetWidth / 2 + pos[0]; this.y = this.leftSection.offsetHeight * 0.4 + pos[1];
			this.rotation = Math.PI * 2 - this.rad;
			if (this.getComponent('pointerInteractive').hovered) {
				if (Date.now() - decay.lastWrinklerScroll > 100 && !(decay.powerClicksOn() && decay.power >= decay.firstPowerClickReq) && !decay.isConditional('reindeer') && ((decay.prefs.scrollWrinklers && Game.Scroll!=0) || (Game.keys[65] && decay.prefs.touchpad) || decay.easyClicksEnable)) { 
					decay.onWrinklerClick.call(this);
					//console.log(Date.now() - decay.lastWrinklerClick);
					decay.lastWrinklerClick = Date.now();
					decay.lastWrinklerScroll = Math.max(Date.now() - 250, decay.lastWrinklerScroll + 100);
				} 
				this.hurt = Math.max(this.hurt, this.phantom?(this.vulnerability?34:5):20); 
				if (Game.Has('Eye of the wrinkler')) { 
					const c = this.findChild('wc');
					decay.EOTWObj.distDisplay = this.dist > 0;
					const h = Crumbs.h.rv(-c.getTrueRotation() + Math.PI, Crumbs.getOffsetX(c.anchor, Crumbs.getPWidth(c)) - 0.5 * Crumbs.getPWidth(c), Crumbs.getOffsetY(c.anchor, Crumbs.getPHeight(c)));
					decay.EOTWObj.targetX = c.getTrueX() + h[0]; 
					decay.EOTWObj.targetY = c.getTrueY() + h[1]; 
					decay.EOTWObj.targetComponent = this.getComponent('pointerInteractive');
					decay.EOTWObj.explosionProgress = this.explosionProgress;
					decay.EOTWObj.bomber = this.bomber;
				}
				decay.EOTWObj.targetWrinkler = this; //used for other stuff
				decay.EOTWObj.frames = -(this.dist / this.lastDistMoved); //same so moved out here
			}
		});
		decay.wrinklerVisualMovement = new Crumbs.behavior(function() {
			this.rotation = (Math.sin(Game.T*1)*Math.min(Math.pow(this.parent.hurt, 0.75), 200))*0.004;
			if (Game.prefs.fancy) { this.rotation += Math.sin(Game.T*0.05+this.parent.rad * 10)*0.08 + Math.sin(Game.T*0.09+this.parent.dist * 4)*0.06; }
			this.alpha = Math.min(Math.max((Crumbs.t - this.t) / 240, 1 - this.parent.dist), 1);
		});
		decay.wrinklerSkins = new Crumbs.behavior(function() {
			if (this.parent.shiny) { 
				if (Game.season == 'christmas') { this.imgUsing = Game.WINKLERS?8:4; return; }
				this.imgUsing = Game.WINKLERS?6:2; return; 
			} else {
				if (Game.season == 'christmas') { this.imgUsing = Game.WINKLERS?7:3; return; }
				this.imgUsing = Game.WINKLERS?5:1; return;
			}
		});
		decay.wrinklerSplits = new Crumbs.behavior(function() {
			if (this.parent.parent.explosionProgress < 0.25) { this.noDraw = true; return; } else { this.noDraw = false; }
			this.sx = Math.floor(this.parent.parent.explosionProgress * 4) * 100;
			this.sy = this.parent.shiny?200:0;
		});
		decay.wrinklerAI = new Crumbs.behavior(function() {
			const toAdd = -this.speedMult * (decay.wrinklerApproach / Game.fps) * (this.bomber?2.5:1);
			this.dist = Math.max(this.dist + toAdd * (1 / Math.max((this.hurt - decay.wrinklerHurtNoEffectMinimum) / (Game.Has('Eternal light')?15:30) * (this.lumpCarrying?1.5:1), 1)), 0);
			this.lastDistMoved = toAdd;
		});
		decay.wrinklerHurtDecRate = 120;
		decay.getWrinklerHurtDecRate = function() {
			let def = 120 * (1 + Math.max(Game.log10CookiesSimulated - 24, 0) * 0.03);
			let mult = 1;
			return def * mult;
		};
		Game.registerHook('logic', function() {
			if (Game.T % 3 != 0) { return; }
			decay.wrinklerHurtDecRate = decay.getWrinklerHurtDecRate();
		})
		decay.wrinklerHurtNoEffectMinimum = 20;
		decay.wrinklerStats = new Crumbs.behavior(function() {
			this.hp = Math.min(this.hp + decay.wrinklerRegen, this.hpMax);
			if (this.dist <= 0) { 
                this.sucked += Math.max(Game.cpsSucked, (Math.pow(Math.min(Game.cookiesInTermsOfCps,10000), 0.2) - 5)) * (this.shiny?3:1) * Game.cookiesPs * decay.wrinklersN / Game.fps; 
				if (this.bomber) { this.explosionProgress += (1 / ((this.bomber?(2+this.size):(30+20*this.size)) * Game.fps)); }
            }
            if (this.explosionProgress >= 1) { decay.wrinklerExplosion.call(this); return; }
			if (Math.random()<0.01 && !Game.prefs.notScary) this.hurt=Math.max(this.hurt,Math.random() * 10);
			this.hurt = Math.max(this.hurt - decay.wrinklerHurtDecRate / Game.fps / (1 + decay.powerPokedStack), 0);
		});
		decay.wrinklerGlintTemplate = {
			imgs: ['glint'],
			anchor: 'top-left',
			components: new Crumbs.component.settings({globalCompositeOperation: 'lighter'}),
			order: 5,
			behaviors: function(p) {
				if (this.t > 0) { this.die(); }
			}
		}
		decay.wrinklerParticles = new Crumbs.behavior(function() { 
			if (Game.prefs.particles) {
				if (this.dist == 0 && Math.random() < 0.015) {
					Crumbs.spawnFallingCookie(this.x, this.y, Math.random()*-2-2, Math.random()*4-2, 1, 'wrinklerPassive', false, Math.random()*0.5+0.5, 4, true);
				}
			} 
			if (this.bomber && Game.T % 7 == 0) {
				const m = Crumbs.spawnParticle(decay.bomberParticle, this.x, this.y, Math.random(), 1, 'left');
				m.iniX = 0.5 - Math.random();
			}
		});
		//eval('Crumbs.objectInits.wrinklerWidgets='+Crumbs.objectInits.wrinklerWidgets.toString().replace(`anchor: 'top-left',`, `anchor: 'top',`).replaceAll('Game.wrinklers[this.wId]', 'this')); //LMAO
		decay.compileSucking = function() {
			let list = Crumbs.getObjects('w', 'left');
			let sucking = 0;
			for (let i of list) {
				if (i.dist == 0) { sucking++; }
			}
			return sucking;
		};
		decay.wrinklerBitSelection = {
			0: 1,
			1: 5,
			2: 3,
			3: 7,
			4: 6,
			5: 2,
			6: 0,
			7: 4
		}
		Crumbs.wrinklerBit.anchor = 'top';
		Crumbs.wrinklerBit.order = 9;
		decay.spawnWrinklerbits = function(obj, amount, speed, expireAfterMult, func, param1, param2) {
			const seed = Math.floor(Math.random() * 8) + Crumbs.objects.left.length;
			for (let i = 0; i < amount; i++) { 
				const [modXD, modYD] = func?func(speed, param1, param2):[0, 0];
				const w = Crumbs.spawnVisible(Crumbs.wrinklerBit, {
					behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieFall, {yd: func?modYD:(Math.random()*-2-2)}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.horizontal, {speed: func?modXD:(Math.random()*4-2)}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.expireAfter, {t: speed * Game.fps * (expireAfterMult ?? 1) }), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeout, {speed: 1 / (speed * Game.fps * (expireAfterMult ?? 1)) })],
					imgUsing: obj.shiny?1:0,
					x: obj.x,
					y: obj.y,
					rotation: obj.rotation,
					scaleX: obj.scaleX,
					scaleY: obj.scaleY,
					sx: (decay.wrinklerBitSelection[(seed + i * 3)%8]) * 100
				});
			}
		};
		decay.objectConnectTemplate = {
			obj1: null,
			obj2: null,
			widthMult: 1,
			configs: {
				defaultWidth: 4,
				widthWobbleAmplitude: 2,
				widthWobblePeriod: 3 * Game.fps
			},
			color: ' #e0e0e0',
			behaviors: new Crumbs.behaviorInstance(function() {
				if (Crumbs.t - this.obj1.t < 6) { return; }
				this.widthMult -= 3 / Game.fps;
				if (this.widthMult <= 0) { this.die(); }
			}),
			components: new Crumbs.component.canvasManipulator({ function: function(m, ctx) {
				if (!(m.obj1 && m.obj2)) { return; }
					
				ctx.beginPath();
				ctx.strokeStyle = m.color;
				ctx.lineWidth = Math.floor((m.configs.defaultWidth + Math.sin((Crumbs.t - m.obj1.t) / m.configs.widthWobblePeriod * 2 * Math.PI) * m.configs.widthWobbleAmplitude) * m.widthMult)
				ctx.moveTo(m.obj1.x, m.obj1.y);
				ctx.lineTo(m.obj2.x, m.obj2.y);
				ctx.stroke();
			} })
		}
		decay.wrinklerSizeHPMap = {
			0: 3,
			1: 5,
			2: 9,
			3: 13,
			4: 18,
			5: 24,
			6: 32,
			7: 42,
			8: 54,
			9: 68,
			10: 84,
			11: 102,
			12: 122,
		}
		decay.getWrinklerHPMult = function() {
			return 1 / ((this.shiny?(0.333 * (Game.Has('Ancient shiny busters')?(1 + Math.min(Game.Objects.Grandma.amount, 800) * 0.0005):1)):1) * ((this.bomber && !this.lumpCarrying)?2:1) * (this.lumpCarrying?(0.33 * (1 + 0.3 * Game.Has('Diabetica Daemonicus'))):1));
		}
		decay.wrinklerHPFromSize = function(size) {
			if (size <= 12) { return decay.wrinklerSizeHPMap[size]; }
			return 20 * size - 118;
		}
		decay.getWrinklerHP = function() {
			return decay.wrinklerHPFromSize(this.size) * decay.getWrinklerHPMult.call(this);
		}
		Game.dropHalloweenCookie = function(me) {
			var failRate=0.95;
			if (Game.HasAchiev('Spooky cookies')) failRate=0.8;
			if (Game.Has('Starterror')) failRate*=0.9;
			failRate*=1/Game.dropRateMult();
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('seasons');
				if (godLvl==1) failRate*=0.9;
				else if (godLvl==2) failRate*=0.95;
				else if (godLvl==3) failRate*=0.97;
			}
			if (me.shiny) failRate*=0.8;
			if (me.sucked) failRate*=0.5;
			if (Math.random()>failRate)//halloween cookie drops
			{
				var cookie=choose(['Skull cookies','Ghost cookies','Bat cookies','Slime cookies','Pumpkin cookies','Eyeball cookies','Spider cookies']);
				if (!Game.HasUnlocked(cookie) && !Game.Has(cookie))
				{
					Game.Unlock(cookie);
					Game.Notify(Game.Upgrades[cookie].dname,loc("You also found <b>%1</b>!",Game.Upgrades[cookie].dname),Game.Upgrades[cookie].icon);
				}
			}
		}
		decay.dealPassthroughDamage = function(w, damage) {
			const prevSize = w.size;
			let dur = 0;
			while (true) {
				if (damage <= w.hp) { 
					w.hp -= damage; 
					if (w.size < prevSize && w.lumpCarrying) { 
						decay.createLumpGrowths.call(w); 
						Game.gainBuff('sugarBoost', dur);
					}
					return; 
				}
				damage -= w.hp;
				w.size--;
				dur = Math.min(dur + 1.2, 3);
				if (w.size <= 0) { 
					w.hp = 0; 
					if (w.size < prevSize && w.lumpCarrying) { 
						decay.createLumpGrowths.call(w); 
						Game.gainBuff('sugarBoost', dur);
					}
					return; 
				} else { w.hpMax = decay.getWrinklerHP.call(w); w.hp = w.hpMax; }
			}
		}
        addLoc('Popped a wrinkler');
		decay.hitWrinkler = function(damage, passthrough, fromPC, hurtMult) {
			if (passthrough) {
				decay.dealPassthroughDamage(this, damage);
				return;
			} 
			
			if (decay.lumpCarriersList.length && hurtMult) { 
				const m = 1 / (1 + (decay.lumpCarriersList.length - (this.lumpCarrying?1:0)) * 1.5);
				damage *= m;
				hurtMult *= m;
				for (let i = decay.lumpCarriersList.length - 1; i >= 0; i--) {
					if (decay.lumpCarriersList[i] == this) { continue; }
					decay.lumpCarriersList[i].hurt += 40 * hurtMult;
					Crumbs.spawn(decay.objectConnectTemplate, {
						obj1: this,
						obj2: decay.lumpCarriersList[i]
					});
					decay.damageWrinkler.call(decay.lumpCarriersList[i], damage, false, fromPC, 0);
				}
				if (!fromPC && !this.lumpCarrying) { Crumbs.spawn(decay.lumpShieldTemplate, {
					x: this.scope.mouseX,
					y: this.scope.mouseY,
					rotation: Math.random() * Math.PI
				}); }
			}

			this.hp -= damage; 
			
			this.hurt = Math.max(Math.ceil(hurtMult * 450), this.hurt);
		}
		decay.damageWrinkler = function(damage, passthrough, fromPC, hurtMult) {
			hurtMult = hurtMult ?? 1;
			decay.hitWrinkler.call(this, damage, passthrough, fromPC, hurtMult);

			if (this.hp > 0 && (this.size > 0 + Game.Has('Molten piercer') * (decay.challengeStatus('purity1')?2:1))) { return; }
				
            if (this.size <= 0 + Game.Has('Molten piercer') * (decay.challengeStatus('purity1')?2:1) && !(fromPC && this.size > 0)) { 
                decay.wrinklerDeath.call(this, fromPC);
            } else {
                this.size--;
                this.hurt = Math.max(decay.wrinklerResistance * 200, this.hurt);
				this.hurt += decay.wrinklerResistance * 150;
                this.hpMax = decay.getWrinklerHP.call(this);
                this.hp = this.hpMax;
                if (!fromPC) { decay.spawnWrinklerbits(this, 3 + Math.floor(Math.random() * 3), 1); }
				if (this.lumpCarrying) { 
					decay.createLumpGrowths.call(this); 
					if (Game.hasBuff('Sugar boost')) {
						Game.hasBuff('Sugar boost').dur = Math.min(0.5 * Game.fps, 4 * Game.fps);
					} else {
						Game.gainBuff('sugarBoost', 1.2);
					}
				}
				if (this.phantom) {
					const angle = Math.random() * 2 * Math.PI;
					const speed = Math.random() * 180 + 120;
					for (let i = 0; i < randomFloor(this.size / 5); i++) {
						decay.triggerNotif('phantomEssence');
						Crumbs.spawn(decay.phantomEssenceTemplate, {
							x: this.x,
							y: this.y,
							xd: Math.cos(angle) * speed,
							yd: Math.sin(angle) * speed
						});
					}
				}
				//else { decay.spawnWrinklerbits(this, 5, fromPC, 1.5, decay.wrinklerExplosionBitsFunc, fromPC); }
            }
		}
		decay.getSpecialProtectMult = function() {
			return this.damageMult;
		}
		decay.onWrinklerClick = function() {
			if (!decay.gameCan.popWrinklers) { return; }
			if (this.phantom && !this.vulnerability) {
				decay.triggerNotif('phantoms');
				return;
			}

			Game.playWrinklerSquishSound();
			if (decay.powerClicksOn() && decay.spendPowerClick()) {
				decay.performPowerWrinklerClick.call(this);
				return; 
			}
			decay.damageWrinkler.call(this, decay.wrinklerResistance * (this.vulnerability?2:1) * decay.getSpecialProtectMult.call(this), false, false, this.vulnerability?1.6:1);
			if (this.lumpCarrying) {
				Crumbs.spawnFallingCookie(0, 0, Math.random()*-2-2, Math.random()*4-2, 1, 'lumpSmall', true, Math.random()*0.5+0.75, 2, false, [23, 14]);
			}
			decay.performTouchOfForce(this);
		}
		addLoc('Decay amplified!');
		decay.updateWrinklers = function() {
			const d = Game.hasBuff('Distorted');
			if (Math.random() < (1 - Math.pow(1 - decay.wrinklerSpawnRate, (d?3.5:1))) / (Math.pow(decay.wrinklersN, (d?0.1:0.5)) + 1)) {
				if ((Math.random() < 1 - 1 / Math.pow(-(decay.times.sinceWrinklerSpawn / Game.fps) * Math.log10(decay.gen) + 1, 0.5)) || (decay.gen >= 1 && Math.random() < 1 - 1 / Math.pow((decay.times.sinceWrinklerSpawn / Game.fps) + 1, 0.25)) || Math.random() < 0.15) {
					if ((d && Math.random() < 0.3) || !d) { decay.spawnWrinklerLead(); }
				} 
				if (d) { decay.spawnWrinklerDistorted(); }
			}
		};
		decay.unlockWrinklerambergris = function (me) {
			if (!Game.HasUnlocked('Wrinkler ambergris') && Math.random() < 1 / (me.shiny?10:100)) {
				Game.Unlock('Wrinkler ambergris');
				Game.Notify('You found Wrinkler ambergris!', '', [7, 2, kaizoCookies.images.custImg], 10, 1);
			}
		}
		addLoc('-%1!');
		addLoc('You lost <b>%1</b>!');
		addLoc('You have become cursed and coagulated!');
		decay.onWrinklerSuckedPop = function() {
			this.sucked *= decay.wrinklerLossMult;
            Game.Notify(loc("Popped a wrinkler"), Game.Has('Legacy')?loc("You have become cursed and coagulated!"):'', [19, 8], 6);
            //if (this.sucked >= 1) { Game.Popup('<div style="font-size:80%;">' + loc("-%1!", loc("%1 cookie", LBeautify(this.sucked))) + '</div>', Game.mouseX, Game.mouseY); }
			//else { Game.Popup('<div style="font-size:80%;">' + loc('Decay amplified!') + '</div>', Game.mouseX, Game.mouseY); decay.amplifyAll(1.5, 0.15); decay.triggerNotif('wrinklerAmplify'); }
            for (let i = 0; i < 7; i++) {
                Crumbs.spawnFallingCookie(0, 0, Math.random() * 4 - 6, Math.random() * 8 - 4, 3, 'wrinklerPoppedCookie', true, Math.random() * 0.25 + 0.75, 3, true);
            }

			//if (this.shiny) { decay.triggerNotif('shinyWrinkler'); }
			Game.DropEgg(0.6);
			if (Game.season == 'halloween') { Game.dropHalloweenCookie(this); }
        	Game.cookies = Math.max(0, Game.cookies - this.sucked);
			if (Game.Has('Legacy')) {
            	Game.gainBuff('coagulated', 4 + Game.log10CookiesSimulated * 0.2);
            	Game.gainBuff('cursed', 2.5);
			}
			decay.unlockWrinklerambergris(this);
		}
		decay.onWrinklerIntercept = function() {
			Game.DropEgg(0.95);
			if (Game.season == 'halloween') { Game.dropHalloweenCookie(this); }
		}
		decay.wrinklersPoppedTotal = 0;
		decay.onWrinklerPop = function() {
			Game.wrinklersPopped++;
			decay.wrinklersPoppedTotal++;
			if (this.shiny) { Game.Win('Last Chance to See'); }
			if (this.bomber) { Game.Win('Undead terrorism'); }
			if (this.lumpCarrying) { 
				Crumbs.spawn(decay.lumpToyCollectibleTemplate, { 
					type: this.lumpCarrying, 
					sy: decay.getLumpIconYPos(6, this.lumpCarrying) * 48, 
					rotation: Math.random() * Math.PI * 2, 
					x: this.x, 
					y: this.y, 
					xd: (Math.max(Math.min(1000 / (this.x - this.scope.l.offsetWidth / 2), 400), -400) / 5)
				});
				decay.triggerNotif('lumps')
				Game.gainBuff('sugarBoost', 2); 
				decay.recalculateLumpCarriers();
			}
			let soulAmount = 1;
			if (Game.Has('Sacrilegious corruption')) { soulAmount *= 1.1; }
			if (decay.isConditional('powerClickWrinklers')) { soulAmount *= 0.5; }
			for (let i = 0; i < randomFloor(soulAmount); i++) {
				decay.spawnWrinklerSoul(this.x, this.y, this.shiny, ((5 + i) * (this.shiny?0.5:1)) / Game.fps, (Math.random() - 0.5) * (6 + i * 3));
			}
		}
		addLoc('+%1 sugar lump!', ['+%1 sugar lump!', '+%1 sugar lumps!']);
        decay.wrinklerDeath = function(noSpawnGore) {
            this.die();
			this.dead = true;
			decay.wrinklersN--;
			PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
			if (this.bomber) { 
				decay.bombersPopped++; 
				decay.bombersPoppedLocal++;
				decay.accumulateFuse(0.5 + 0.5 * Math.random());
				decay.triggerNotif('bombers');
				decay.prefs.preventNotifs.bomberHint = true;
			}
            if (this.sucked && this.dist <= 0) {
                decay.onWrinklerSuckedPop.call(this);
            } else {
                decay.onWrinklerIntercept.call(this);
            }
			this.getComponent('pointerInteractive').enabled = false;
            if (!noSpawnGore) { decay.spawnWrinklerbits(this, 8, 2.5); }
            decay.onWrinklerPop.call(this);
        }
        addLoc('Decay halting requirement +50% for %1!');
        new Game.buffType('coagulated', function(time) {
            return {
                name: 'Coagulated',
                desc: loc('Decay halting requirement +50% for %1!', Game.sayTime(time * Game.fps, -1)),
                time: time*Game.fps,
                add: true,
                icon: [8, 3, kaizoCookies.images.custImg],
                aura: 2
            }
        });
        addLoc('Decay halting requirement +200% for %1!');
        addLoc('Decay rates and halting requirement +200% for %1!');
        new Game.buffType('cursed', function(time) {
            return {
                name: 'Cursed',
                desc: (decay.momentumUnlocked?loc('Decay halting requirement +200% for %1!', Game.sayTime(time * Game.fps, -1)):loc('Decay halting requirement +200% for %1!', Game.sayTime(time, -1))),
                time: time*Game.fps,
                max: true,
                icon: [18, 6],
                aura: 2
            }
        });
        addLoc('Bombers incoming!');
        new Game.buffType('distorted', function(time) {
            return {
                name: 'Distorted',
                desc: loc('Bombers incoming!'),
                time: time*Game.fps,
                icon: [9, 2, kaizoCookies.images.custImg],
                aura: 2
            }
        });
		addLoc('Wrinkler speed x6 for %1!');
		new Game.buffType('sugarBoost', function(time) {
			return {
				name: 'Sugar boost',
				desc: loc('Wrinkler speed x6 for %1!', Game.sayTime(time)),
				time: time*Game.fps,
				icon: [29, 17],
				max: true,
				aura: 2
			}
		});
		//function layersUp() { let list = Crumbs.getObjects('w'); for (let i in list) { list[i].size += 2; } }
        decay.wrinklerExplosionBitsFunc = function(speed, xDiff, yDiff) {
			const mag = (Math.random() * 3 + 2) * speed;
        	const rad = Math.random() * Math.PI * 1.5 - 0.25 * Math.PI;
			let xd = Math.cos(rad) * mag;
			let yd = -Math.sin(rad) * mag;
			if (!xDiff || !yDiff) { return [xd, yd]; }
			//here xDiff and yDiff is difference from position of the shockwave center to the wrinkler anchor
			const dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
			xd -= 5 * speed / dist * xDiff;
			yd -= 5 * speed / dist * yDiff;
			return [xd, yd];
        }
        decay.wrinklerExplosion = function() { 
			decay.wrinklersN--;
            this.die();

            this.sucked += Game.cookies * (this.bomber?0.05:0.25);
			this.sucked *= decay.wrinklerLossMult;
            Game.Notify(loc("Wrinkler exploded!"), loc('You lost <b>%1</b>!', loc('%1 cookie', LBeautify(this.sucked))+'</div>'), [(this.bomber?14:12), 1, kaizoCookies.images.custImg], 6);
            if (this.sucked >= 1) { Game.Popup('<div style="font-size:80%;">' + loc("-%1!", loc("%1 cookie", LBeautify(this.sucked))) + '</div>', this.x, this.y); }
			//else { Game.Popup('<div style="font-size:80%;">' + loc('Decay amplified!') + '</div>', Game.mouseX, Game.mouseY); decay.amplifyAll(1.5, 0.15); decay.triggerNotif('wrinklerAmplify'); }
            Game.cookies = Math.max(0, Game.cookies - this.sucked);
            if (!this.bomber) { Game.gainBuff('clot', 66 * (Game.resets==0?0.1:1), 0.5); }
            Game.gainBuff('coagulated', (this.bomber?10:20) * (Game.resets==0?0.2:1));
            Game.gainBuff('cursed', (this.bomber?5:10) * (Game.resets==0?0.2:1));
            if (this.bomber) { 
				Game.gainBuff('distorted', 30); 
				Game.Win('Way to soulflow');
			}

			for (let i = 0; i < 16; i++) {
                Crumbs.spawnFallingCookie(this.x, this.y, Math.random() * 4 - 6, Math.random() * 8 - 4, 5, 'wrinklerExplodedCookie', false, Math.random() * 0.5 + 0.75, 3, true);
            }

            decay.spawnWrinklerbits(this, 8, 3, 3, decay.wrinklerExplosionBitsFunc);

			this.getComponent('pointerInteractive').enabled = false;

			if (this.lumpCarrying) { decay.recalculateLumpCarriers(); }
        }
		//Crumbs.prefs.colliderDisplay = 1; decay.createLumpGrowths.call(Crumbs.findObject('w'));
		decay.spawnWrinkler = function(obj) {
			//obj can have: rad, dist, size, shiny (bool), leading (bool), bomber (bool), armored (bool), phantom (bool)
			//size is 1 for normal, 0 for small, 2 for medium
			obj = obj??{};
			obj.components = new Crumbs.component.pointerInteractive({ boundingType: 'oval', onRelease: decay.onWrinklerClick });
			const r = Crumbs.spawn(decay.wrinklerTemplate, obj);
			if (!r) { return; }

			r.hpMax = decay.getWrinklerHP.call(r);
			r.hp = r.hpMax;
			if (r.lumpCarrying) { 
				decay.recalculateLumpCarriers(); 
				decay.createLumpGrowths.call(r);
			}
			decay.wrinklersN++;
			decay.triggerNotif('wrinkler');
			decay.times.sinceWrinklerSpawn = 0;
			return r;
		}
		decay.getCurrentWrinklerSize = function(rand) {
			let size = randomFloor(Math.pow(Math.max(Game.log10CookiesSimulated * (1 + Math.random() * 0.5) - 8 /*+ Math.pow(Math.max(Game.log10CookiesSimulated - 23, 0) * 0.5, 0.25) */, 1), 0.5));
			if (rand > 98 && Game.log10CookiesSimulated > 36) { size += 2; }
			if (rand > 95 && Game.log10CookiesSimulated > 33) { size++; }
			if (rand > 90 && Game.log10CookiesSimulated > 30) { size++; }
			if (rand > 60) { size++; } 
			if (rand > 25 && Game.log10CookiesSimulated > 24) { size++; }
			//if (size > 1 && Game.Has('Elder spice') && Math.random() < 0.07) { size--; } 
			return size;
		}
		decay.spawnWrinklerLead = function() {
			if (!decay.unlocked || decay.wrinklersN >= 72) { return; }
			let obj = {};
			obj.size = decay.getCurrentWrinklerSize(Math.random() * 100);
			obj.rad = Math.random() * Math.PI * 2;
			obj.speedMult = Math.min(Math.pow(Math.random() * (0.8 + Game.log10CookiesSimulated * 0.01) + 0.6, Math.pow(1 + Math.random() * Math.max(Game.log10CookiesSimulated - 30, 0) * 0.2, 0.5)), 2.5);
			if (Math.random() < 0.1) { obj.speedMult = Math.pow(obj.speedMult, 1.5); }
			if (Math.random() < 0.05) { obj.speedMult = Math.pow(obj.speedMult, 1.5); }
			obj.damageMult = (Math.random() * 0.6 + 0.7) * Math.min(Math.pow(obj.speedMult, 1.5), 1);
			for (let i = 0; i < Math.ceil(Math.random() * (Math.sqrt(Game.log10CookiesSimulated))); i++) {
				let pool = [];
				if (!obj.shiny && Math.random() < 0.15 && Game.cookiesEarned > decay.featureUnlockThresholds.shiny) { pool.push('shiny'); }
				if (!obj.bomber && Math.random() < 0.01 + 0.01 * Math.pow(Math.max(decay.times.sinceBomberSpawn - 600, 0) / 30, 0.7) && Game.cookiesEarned > decay.featureUnlockThresholds.bomberNat) { pool.push('bomber'); }
				if (!obj.armored && Math.random() < 0.05 && Game.cookiesEarned > decay.featureUnlockThresholds.armored) { pool.push('armored'); }
				if (!obj.phantom && Math.random() < 0.05 && Game.cookiesEarned > decay.featureUnlockThresholds.phantom) { pool.push('phantom'); }
				//if (!obj.leading && Math.random() < 0.01 && Game.cookiesEarned > decay.featureUnlockThresholds.leading) { pool.push('leading'); }
				if (pool.length) { obj[choose(pool)] = true; }
			}
			if (obj.bomber) { decay.times.sinceBomberSpawn = 0; }
			if (!obj.lumpCarrying && (Math.random() < 0.15 || obj.shiny || (obj.bomber && Math.random() < 0.4) || obj.armored || obj.phantom) && Game.cookiesEarned > 1e9 && Math.random() < 1 - Math.pow(0.96, decay.getLumpWrinklerReplaceMultiplier())) { 
				obj.lumpCarrying = decay.getRandomLumpType.call(this); 
			} //roughly 20 minutes per lump early on
			//increase lump strength or smth
			if (decay.isConditional('knockbackTutorial')) { obj.dist = 0.15; }
			return decay.spawnWrinkler(obj); 
		};
		decay.spawnWrinklerDistorted = function() {
			let obj = { bomber: true };
			obj.size = decay.getCurrentWrinklerSize(Math.random() * 100);
			if (obj.size <= 14) { 
				obj.size = Math.round(Math.max(obj.size - Math.min(Math.max(Math.pow(14 - obj.size, 0.6), 0), 5) - 1, 0)); 
			} else {
				obj.size -= 1;
			}
			obj.rad = Math.random() * Math.PI * 2;
			obj.speedMult = Math.random() * 0.8 + 0.6;
			if (Math.random() < 0.1) { obj.speedMult = Math.pow(obj.speedMult, 1.5); }
			if (Math.random() < 0.05) { obj.speedMult = Math.pow(obj.speedMult, 1.5); }
			obj.damageMult = Math.random() * 0.4 + 0.8;
			if (Math.random() < 0.025 && Game.cookiesEarned > decay.featureUnlockThresholds.shiny) { obj.shiny = true; }
			if (Math.random() < 0.01 && Game.cookiesEarned > decay.featureUnlockThresholds.phantom) { obj.phantom = true; }
			if (Math.random() < 0.01 && Game.cookiesEarned > decay.featureUnlockThresholds.armored) { obj.armored = true; }
			if (Math.random() < 1 - Math.pow(0.96, decay.getLumpWrinklerReplaceMultiplier()) && (Math.random() < 0.1 || obj.shiny || obj.armored || obj.phantom) && Game.cookiesEarned > 1e9) { obj.lumpCarrying = decay.getRandomLumpType.call(this); }
			decay.times.sinceBomberSpawn = 0;
			return decay.spawnWrinkler(obj);
		};
		decay.bombersPopped = 0;
		decay.bombersPoppedLocal = 0;
		decay.bomberParticle = { 
			width: 3, 
			height: 3, 
			img: kaizoCookies.images.bomberParticle, 
			life: 1 * Game.fps,
			behavior: function () { 
				this.width += 0.2; 
				this.height += 0.2; 
				this.y += this.iniY; 
				this.x += this.iniX;
				this.r += 0.3 / Game.fps;
				this.alpha -= 0.6 / Game.fps;
			},
			iniX: 0,
			iniY: -2,
			reusePool: Crumbs.newReusePool()
		}
		//Game.registerHook('logic', function() { const m = Crumbs.spawnParticle(decay.bomberParticle, 100, 100, 0, 1, 'left'); m.rotation = Math.random(); m.iniX = 0.5 - Math.random(); });
		decay.shinyWrinklerSparkleFunc = function(m, ctx) {
			if (!m.parent.shiny || Math.random() >= 0.3 || !Game.prefs.particles) { return; }
			const prevA = ctx.globalAlpha;
			ctx.globalAlpha = Math.random() * 0.65 + 0.1;
			let s = Math.random() * 30 + 5;
			const prev = ctx.globalCompositeOperation;
			ctx.globalCompositeOperation = 'lighter';
			ctx.drawImage(Pic('glint.png'), (-s / 2 + Math.random() * 50 - 25) * m.parent.scaleX, (-s / 2 + Math.random() * 200) * m.parent.scaleY, s, s);
			ctx.globalCompositeOperation = prev;
			ctx.globalAlpha = prevA;
		}
		decay.highlightFunc = function(m, ctx) {
			if (decay.phantomCertifiedWrinklerSelect == m.parent) {
				const p = Pic(kaizoCookies.images.wrinklerOutline);
				const pWidth = Crumbs.getPWidth(m);
				const pHeight = Crumbs.getPHeight(m);
				//console.log(p, m.sx, m.sy, m.width ?? p.width, m.height ?? p.height, m.offsetX - Crumbs.getOffsetX(m.anchor, pWidth), m.offsetY - Crumbs.getOffsetY(m.anchor, pHeight), pWidth, pHeight);
				ctx.drawImage(p, m.sx, m.sy, m.width ?? p.width, m.height ?? p.height, m.offsetX - Crumbs.getOffsetX(m.anchor, pWidth), m.offsetY - Crumbs.getOffsetY(m.anchor, pHeight), pWidth, pHeight);
			}
		}
		decay.wrinklerShadowObj = {
			anchor: 'top',
			y: 30,
			scaleX: 5,
			scaleY: 5,
			order: 1,
			imgs: ['img/wrinklerShadow.png'],
			behaviors: new Crumbs.behaviorInstance(function(p) {
				if (Game.prefs.fancy && !this.parent.parent.phantom) {
					this.noDraw = false;
					this.alpha = this.parent.alpha;
					this.y = 7 + this.parent.parent.size * 7;
					return;
				} 
				this.noDraw = true;
			})
		}
		decay.wrinklerImgList = ['', 'img/wrinkler.png', 'img/shinyWrinkler.png', 'img/winterWrinkler.png', kaizoCookies.images.winterShinyWrinkler, 'winkler.png', 'shinyWinkler.png', 'winterWinkler.png', kaizoCookies.images.winterShinyWinkler];
		decay.wrinklerInit = function() {
			if (this.parent.phantom) {
				this.addComponent(new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }));
				const reso = 3 * (Game.prefs.fancy?1:4);
				this.parent.addComponent(new Crumbs.component.canvasManipulator({ function: decay.wrinklerPhantomVulnerabilityDrawer }));
				this.addComponent(new Crumbs.component.linearFade({ 
					cutOff: true,
					flip: true,
					distance: 40,
					sliceWidth: reso,
					enabled: true
				}));
				this.addComponent(new Crumbs.component.linearFade({ 
					cutOff: true,
					distance: 40,
					sliceWidth: reso,
					enabled: true
				}));
				this.addComponent(new Crumbs.component.linearFade({
					distance: 50,
					progress: 0.25,	
					sliceWidth: reso,
					enabled: false
				}));
				this.addBehavior(decay.wrinklerPhantomManager);

				this.parent.vulnerability = 0; //amount of time in seconds vulnerable to attacks, each soul raises it by some amount (4 sec maybe)
			}
		}
		decay.wrinklerPhantomManager = new Crumbs.behaviorInstance(function() {
			if (!this.parent.phantom) { return; }

			const [lf1, lf2, lf3] = this.getAllComponents('linearFade');
			const dur = (this.parent.bomber?2.5:6.5) * Game.fps;
			const frac = Math.pow(((Crumbs.t - this.t + dur / 2) % dur) / dur * (this.parent.bomber?1.5:2.5), 2);

			lf1.progress = frac - 20 / 200;
			lf2.progress = frac + 20 / 200;

			if (this.parent.dist <= 0 || this.parent.getComponent('pointerInteractive').hovered) { lf3.enabled = true; } 
			else { lf3.enabled = false; }
 
			if (this.parent.vulnerability > 0 && this.parent.hurt < 35) {
				this.parent.vulnerability -= 1 / Game.fps;
			}
		});
		//phantom primary color: #f0e3ff
		decay.wrinklerPhantomVulnerabilityDrawer = function(m, ctx) { 
			//DRAWN ON PARENT
			const a = Math.max(1 - decay.indicator.lastActive / Game.fps, 0);
			if (!m.vulnerability && a) {
				ctx.globalAlpha = a;
				ctx.beginPath();
				ctx.setLineDash([4, 3]); 
				const width = Crumbs.getPWidth(m);
				const height = Crumbs.getPHeight(m);
				ctx.ellipse(-Crumbs.getOffsetX(m.anchor, width) + width / 2, -Crumbs.getOffsetY(m.anchor, height) + height / 2, width / 2 * 0.9, height / 2 * 0.9, 0, 0, 2 * Math.PI);
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2; 
				ctx.stroke();
			}
			if (!m.vulnerability) { return; }

			Crumbs.forceDrawObject(m.findChild('wc'), ctx, function(ctx2) {
				ctx2.globalAlpha = 1 - 1 / Math.max(1 + m.vulnerability, m.hurt / 200);
				ctx2.globalCompositeOperation = 'lighter';
			});
		}
		decay.renderPhantomVulnerable = function(wrinkler, amount) {
			if (!wrinkler.phantom) { return; }

			wrinkler.vulnerability += amount;
			wrinkler.hurt += 200;
		}
		Crumbs.prefs.warnDuplicateComponents = 0;
		decay.wrinklerDisplayObj = {
			imgs: decay.wrinklerImgList,
			anchor: 'top',
			id: 'wc',
			init: decay.wrinklerInit,
			order: 1.5,
			children: [{
				imgs: kaizoCookies.images.wrinklerSplits,
				anchor: 'top',
				order: 1.55,
				width: 100,
				height: 200,
				behaviors: new Crumbs.behaviorInstance(decay.wrinklerSplits)
			}, decay.wrinklerShadowObj],
			components: new Crumbs.component.canvasManipulator({ before: decay.highlightFunc, function: decay.shinyWrinklerSparkleFunc }),
			behaviors: [new Crumbs.behaviorInstance(decay.wrinklerSkins), new Crumbs.behaviorInstance(decay.wrinklerVisualMovement)]
		};
		decay.wrinklerTemplate = {
			id: 'w',
			imgs: 'wrinkler.png',
			order: 1.5,
			scope: 'left',
			leftSection: Crumbs.getCanvasByScope('left').canvas.parentNode,
			anchor: 'top',
			offsetY: -10,
			noDraw: true,
			rad: 0,
			dist: 1,
			sucked: 0,
			behaviors: [
				new Crumbs.behaviorInstance(decay.wrinklerMovement),
				new Crumbs.behaviorInstance(decay.wrinklerAI),
				new Crumbs.behaviorInstance(decay.wrinklerStats),
				new Crumbs.behaviorInstance(decay.wrinklerParticles)
			],
			children: decay.wrinklerDisplayObj,
			hp: 10,
			hpMax: 10, 
			hurt: 0, //works a bit differently, and actually decreases by 1 every frame until 0
			size: 1,
			speedMult: 1,
			damageMult: 1,
			explosionProgress: 0, //number between 0 and 1, upon reaching 1, explode
			lumpCarrying: 0, //1 is normal, others are the other types idk
			shiny: false,
			leading: false,
			bomber: false,
			armored: false,
			phantom: false
		}
		decay.wrinklerLumpGrowthTemplate = {
			imgs: 'icons.png',
			id: 'lg',
			width: 48,
			height: 48,
			sx: 23 * 48,
			sy: 14 * 48,
			alpha: 0.9,
			order: 2,
			behaviors: new Crumbs.behaviorInstance(function() { this.alpha = this.parent.alpha; })
		}
		decay.lumpShieldTemplate = {
			imgs: 'icons.png',
			width: 48,
			height: 48,
			sx: 29 * 48,
			sy: 14 * 48,
			alpha: 0.5,
			order: 10,
			scaleX: 0.1,
			scaleY: 0.1,
			behaviors: new Crumbs.behaviorInstance(function() {
				if (Crumbs.t - this.t < 0.2 * Game.fps) {
					this.scaleX += 3 / Game.fps;
					this.scaleY += 3 / Game.fps;
				}
				this.scaleX += 1.5 / Game.fps;
				this.scaleY += 1.5 / Game.fps;
				this.alpha -= 1 / Game.fps;
				if (this.alpha <= 0) { this.die(); }
			})
		}
		decay.lumpTypeToRowMap = {
			1: 14,
			2: 15,
			3: 16, 
			4: 17,
			5: 27
		}
		decay.getLumpIconYPos = function(phase, type) {
			if (phase < 4) { return 14; }
			if (type == 2) { 
				if (phase == 6) { return 15; } else { return 14; }
			}
			return decay.lumpTypeToRowMap[type];
		}
		decay.createLumpGrowths = function() {
			let existingGrowths = this.findChild('wc').getChildren('lg');
			for (let i in existingGrowths) {
				existingGrowths[i].die(); //not the most memory efficient but ah well
			} 
			for (let i = 0; i < randomFloor(this.size * 0.5 + 3); i++) {
				const radius = Math.sqrt(Math.random());
				const angle = Math.random() * 2 * Math.PI;
				const phase = Math.min(randomFloor(this.size * 0.8), 5);
				const size = Math.random() * 0.4 + 0.6 - 0.05 * phase; 

				this.findChild('wc').spawnChild(decay.wrinklerLumpGrowthTemplate, {
					offsetX: radius * 35 * Math.cos(angle),
					offsetY: radius * 70 * Math.sin(angle) + 85,
					scaleX: size,
					scaleY: size,
					sx: (23 + phase) * 48,
					sy: decay.getLumpIconYPos(phase, this.lumpCarrying) * 48
				});
			}
		}
		decay.getLumpWrinklerReplaceMultiplier = function() {
			let mult = 1;
			if (Game.hasGod) {
				let godLvl = Game.hasGod('order');
				if (godLvl == 1) { mult *= 1.75; }
				else if (godLvl == 2) { mult *= 1.5; } 
				else if (godLvl == 3) { mult *= 1.25; }
			}
			if (Game.resets > 0) { mult *= 1 + Math.min(Math.max(Game.log10CookiesSimulated - 12, 0) * 0.1, 1); }
			return mult;
		}
		decay.wSoulMovement = new Crumbs.behavior(function(p) {
			if (Game.keys[65] && decay.prefs.touchpad && this.getComponent('pointerInteractive').hovered) { this.grabbed = true; }
			if (!this.grabbed) { this.y -= p.dy * (this.inMilk?0.5:1); }
			if (this.grabbed) {
				if (!this.getComponent('pointerInteractive').click && !Game.keys[65]) { this.grabbed = false; }
				p.dx += ((Math.min(this.scope.mouseX, this.leftSection.offsetWidth) - this.x)) * 0.2;
				p.dx *= 0.9;
				p.dy += ((this.y - this.scope.mouseY)) * 0.2;
				p.dy *= 0.9;
				this.x = Math.min(this.scope.mouseX, this.leftSection.offsetWidth);
				this.y = this.scope.mouseY;
				this.lastGrab = Crumbs.t;
				this.recentlyWithdrawn = false;
			} else {
				p.dy += p.ddy * (this.inMilk?0.1:1);
				if (Game.hasBuff('Reversed momentum') && p.dy > 0) { p.dy = Math.max(p.dy - p.ddy * 1.5, 0); }
				p.dx += (this.cookieAttract?-7.5:1) * ((this.x < Game.cookieOriginX)?-1:1) * 10 / Math.sqrt((this.x - Game.cookieOriginX)**2 + (this.y - Game.cookieOriginY)**2 + 1) * (this.shiny?3:1);
				this.x += p.dx * (this.inMilk?0.5:1) * (Game.hasBuff('Reversed momentum')?0.05:1);
				if (this.inMilk) { 
					const divisor = 1.15;
					p.dy /= divisor; p.dx /= divisor;
					p.dy -= 0.5 / Game.fps; p.dx -= 0.5 / Game.fps; 
				}
				p.dx *= 1 - (0.01);
				p.dy *= 1 - (0.01);
			}
			this.dxExport = p.dx; 
			this.dyExport = p.dy; //spagetti code go br
			if (this.y < -500) { this.die(); }
			if (Crumbs.t - this.t > 20 * Game.fps && this.y > 0) { decay.triggerNotif('soulExpiry'); decay.removeSelfFromGrab.call(this); this.die(); }
		}, { dy: 0, dx: 0, ddy: 10 / Game.fps });
		decay.wSoulClaim = new Crumbs.behavior(function() {
			if ((this.x - Game.cookieOriginX)**2 + (this.y - Game.cookieOriginY)**2 < 6400) { this.inAura += 1 + (this.dxExport * this.dxExport + this.dyExport * this.dyExport) * (this.grabbed?0.5:0.1); } 
			else if (this.inAura == 0 || this.dxExport + this.dyExport < 20) { this.inAura = 0; }
			else { this.inAura = 1000; }
			this.alpha = 1 - this.inAura / (2 * Game.fps);
			if (this.inAura > 2 * Game.fps) { decay.onWSoulClaim(this); decay.removeSelfFromGrab.call(this); this.die(); }
			this.alpha *= 1 - Math.max((Crumbs.t - this.t) / (20 * Game.fps) * 5 - 4, 0);
		});
		decay.wSoulDeposit = new Crumbs.behavior(function(p) {
			if (this.y > this.scope.l.height * (1 - Game.milkHd)) { 
				if (!this.recentlyWithdrawn) { this.inMilk++; }
			} else { 
				this.inMilk = 0; this.recentlyWithdrawn = false; }
			if (!decay.utenglobeUnlocked || !decay.utenglobeStorage[p.target].canDeposit()) { return; }
			this.alpha = 1 - this.inMilk / (2 * Game.fps);
			if (this.inMilk > 2 * Game.fps) { decay.utenglobeStorage[p.target].deposit(1); decay.removeSelfFromGrab.call(this); this.die(); }
		});
		decay.wrinklerSoulShine1 = {
			order: 9,
			alpha: 0.5,
			imgs: ['img/shine.png', 'img/shineGold.png'],
			scaleX: 0.625,
			scaleY: 0.625,
			init: function() { if (this.parent.shiny) { this.imgUsing = 1; this.components.push(new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })); } },
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.spin, { spin: 0.05 }),
				function() { this.alpha = this.parent.alpha * 0.5; }
			]
		};
		decay.wrinklerSoulShine2 = {
			order: 8.8,
			alpha: 0.25,
			imgs: ['img/shine.png', 'img/shineGold.png'],
			scaleX: 0.65,
			scaleY: 0.65,
			init: function() { if (this.parent.shiny) { this.imgUsing = 1; this.components.push(new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })); } },
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.spin, { spin: -0.05 }),
				function() { this.alpha = this.parent.alpha * 0.25; }
			]
		};
		decay.grabbedObj = [];
		decay.removeSelfFromGrab = function() {
			if (decay.grabbedObj.includes(this)) { decay.grabbedObj.splice(decay.grabbedObj.indexOf(this), 1); }
		}
		decay.findHoveringWrinkler = function() {
			const s = Crumbs.scopedCanvas.left;
			let w = null;
			for (let i in s.sortedObjects) {
				if (s.sortedObjects[i].id != 'w') { continue; }
				const o = s.sortedObjects[i];
				if (o.getComponent('pointerInteractive')?.getHoverStatus?.(o, Crumbs.getPWidth(o), Crumbs.getPHeight(o))) { w = o; }
			}
			return w;
		}
		decay.wrinklerSoulTemplate = {
			id: 's',
			scope: 'left',
			width: 32,
			height: 32,
			leftSection: Crumbs.getCanvasByScope('left').canvas.parentNode,
			order: 10,
			shiny: false,
			components: [new Crumbs.component.pointerInteractive({ 
				boundingType: 'oval', 
				onClick: function() { 
					if (decay.grabbedObj.length >= 1) { return; }
					
					this.grabbed = true; 
					decay.grabbedObj.push(this); 
					this.order++; 
				}, 
				onRelease: function() { 
					this.grabbed = false; 
					decay.grabbedObj.splice(decay.grabbedObj.indexOf(this), 1); 
					this.order--; 

					const w = decay.findHoveringWrinkler();
					if (w && w.phantom && !w.vulnerability) {
						decay.renderPhantomVulnerable(w, 6 * (this.shiny?2.5:1));

						Crumbs.spawn(decay.soulClaimAuraTemplate, {
							behaviors: decay.soulClaimAuraBehaviorPure,
							x: this.x,
							y: this.y,
							scope: 'left',
							color: (this.shiny?'#fffd7b':'#7bf6ff'),
							currentSize: 48 * this.scaleX,
							currentWidth: 7,
							expandSpeed: (200) / Game.fps,
							thinningSpeed: 2 / Game.fps,
							expandFriction: (0.85),
							thinningAcceleration: (0.8) / Game.fps
						});

						this.die();
					}
				} })],
			grabbed: false,
			recentlyWithdrawn: true,
			cookieAttract: false,
			inAura: 0,
			inMilk: 0,
			lastGrab: 1
		};
		decay.spawnWrinklerSoul = function(x, y, shiny, ddy, dx) {
			return Crumbs.spawn(decay.wrinklerSoulTemplate, { 
				x: x,
				y: y,
				scaleX: (shiny?1:1.3) * (decay.prefs.bigSouls?1.5:1), 
				scaleY: (shiny?1:1.3) * (decay.prefs.bigSouls?1.5:1),  
				imgs: shiny?kaizoCookies.images.shinySoul:kaizoCookies.images.wrinklerSoul,
				shiny: shiny,
				children: ([decay.wrinklerSoulShine1].concat(Game.prefs.fancy?decay.wrinklerSoulShine2:[])),
				behaviors: [
					new Crumbs.behaviorInstance(decay.wSoulMovement, { ddy: ddy * (shiny?1.35:1) * (decay.slowSouls?0.75:1), dx: dx * (shiny?1.4:1) * (decay.slowSouls?0.4:1) }),
					new Crumbs.behaviorInstance(decay.wSoulClaim),
					new Crumbs.behaviorInstance(decay.wSoulDeposit, { target: (shiny?'shinyS':'s')+'oul' })
				],
			});
		}
		addLoc('Wrinkler soul');
		decay.halts['wSoul'] = new decay.haltChannel({
			properName: loc('Wrinkler soul'),
			keep: 2,
			overtimeLimit: 180,
			overtimeEfficiency: 0.45,
			decMult: 2.1,
			factor: 0.6
		});
		addLoc('Shiny soul');
		decay.halts['wSoulShiny'] = new decay.haltChannel({
			properName: loc('Shiny soul'),
			keep: 2,
			overtimeLimit: 240,
			overtimeEfficiency: 0.5,
			decMult: 2,
			factor: 0.5
		});
		Game.goldenGainMult = function(isWrath) {
			var mult=1;
			if (Game.Has('Green yeast digestives')) mult*=1.01;
			if (Game.Has('Dragon fang')) { mult*=1.03; } 
			if (Game.Has('Lucky radar')) { mult *= 2; }
			if (Game.Has('Shimmering encapsulation')) { mult *= 2; }
			if (Game.Has('Immense flow')) { mult *= 2; }
			if (Game.hasGod) { const lvl = Game.hasGod('decadence'); if (lvl==1) { mult*=1.77; } else if (lvl==2) { mult*=1.57; } else if (lvl==3) { mult*=1.37; } }

			if (!isWrath) mult*=Game.eff('goldenCookieGain');
			else mult*=Game.eff('wrathCookieGain'); //screw power click effect on gc gain, that was too op anyways

			return mult;
		};
		decay.bounceBackIn = 0;
		//eval('decay.onWSoulClaim='+decay.onWSoulClaim.toString().replaceAll('decay.stop(3 * stopMult', 'decay.stop(2 * stopMult')); code for simulating a player being bad at game
		decay.getSoulClaimStopMult = function(me) {
			let stopMult = 1;
			stopMult *= 1.35; //to make souls feel impactful and useful for purity instead of this thing that you use to barely survive that is outclassed by many things later on
			if (me.shiny) { stopMult *= 2; }
			if (decay.exhaustion) {
				if (Game.Has('Elder spice')) { stopMult *= 1.1; }
				if (decay.challengeStatus('veil')) { stopMult *= 1.1; } 
				if (Game.Has('Weightlessness')) { stopMult *= 1.1; }
			}
			if (Game.Has('Santaic zoom')) { stopMult *= 1 + Math.max(Game.santaLevel - 7, 0) * 0.01; }
			return stopMult;
		}
		decay.soulClaimPowerFragMagnitudeMultiplier = 1;
		decay.onWSoulClaim = function(me) {
			const stopMult = decay.getSoulClaimStopMult(me);
			decay.stop(3 * stopMult, 'wSoul');
			if (me.shiny) { decay.stop(3 * stopMult, 'wSoulShiny'); }
			decay.gainPower(
				Math.round(10 * ((me.shiny)?3:1) * (decay.isConditional('powerClickWrinklers')?4.5:1) * (0.75 + Math.random() * 0.5)),
				me.x,
				me.y,
				Math.max(-700 / Game.fps * decay.soulClaimPowerFragMagnitudeMultiplier, Math.min(me.behaviors[0].dx / 2, 700 / Game.fps)),
				Math.max(-700 / Game.fps * decay.soulClaimPowerFragMagnitudeMultiplier, Math.min(-me.behaviors[0].dy / 2, 700 / Game.fps)),
				100 + 200 * decay.soulClaimPowerFragMagnitudeMultiplier
			);
			decay.soulClaimPowerFragMagnitudeMultiplier += 0.3;
			decay.createSoulClaimAura(me);
			decay.times.sinceSoulClaim = 0;
			Game.BigCookieState = 2;
			decay.bounceBackIn = Math.floor(0.15 * (me.shiny?1.5:1) * Game.fps);
			if (decay.exhaustion && Game.Has('Soul compression')) { decay.exhaustion -= Math.round(0.5 * Game.fps); decay.exhaustion = Math.max(decay.exhaustion, 1); }
			if (decay.indicator) { decay.indicator.lastClaiming = 0; if (Math.random() < 0.2) { decay.indicator.direction *= -1; } }
			if (me.shiny) { 
				decay.shinySoulClaimCount++;
				decay.shinySoulClaimCountLocal++;
				if (decay.covenantStatus('gardenTick') && Math.random() < 0.5 && gardenUpdated) {
					gap.loopsMult *= 3;
					gap.logic(true);
					return;
				}
				const h = new Game.shimmer('golden', { type: 'reflective blessing', noWrath: true }, true);
				h.sizeMult = 0.6;
				h.dur = Math.ceil((Math.random()*6+12));
				h.life = Math.ceil(h.dur * Game.fps);
				decay.createShinySoulConnectLines(h.x + 48, h.y + 48);
				Game.Win('A light reward');
				if (decay.shinySoulClaimCount >= 1000) { Game.Win('Greatness unfolding over millenia, without a reason, without an end'); }
				if (decay.shinySoulClaimCount >= 100) { Game.Win('Golden escalation'); }
				if (decay.shinySoulClaimCount >= 10) { Game.Win('Suffering in nobility'); }
				decay.utenglobeUnlocked = true;
			} else {
				if (!decay.challengeStatus('powerClickWrinklers') || decay.soulClaimLocal > (6 + decay.utenglobeSoulCookieUpgradeCount * 2)) { decay.soulClaimCount++; }
				decay.soulClaimCountLocal++;
				Game.Win('Extracts of the cursed');
				if (decay.soulClaimCount >= 10000) { Game.Win('Finality of the unrest'); } 
				if (decay.soulClaimCount >= 1000) { Game.Win('Possibility of the bonded'); } 
				if (decay.soulClaimCount >= 100) { Game.Win('Humanity of the impure'); }
				if (decay.soulClaimCount >= 10) { Game.Win('Energy of the unseen'); }
				if (decay.gen > 1) { Game.Win('A new era of purity'); } 
			}
		}
		Game.registerHook('logic', function() {
			if (decay.bounceBackIn > 0) {
				decay.bounceBackIn--;
				if (decay.bounceBackIn <= 0 && !Game.bigCookieHovered) { Game.BigCookieState = 0; }
			}
			if (decay.times.sinceSoulClaim > 1 * Game.fps) {
				decay.soulClaimPowerFragMagnitudeMultiplier = Math.max(1, decay.soulClaimPowerFragMagnitudeMultiplier - 0.5 / Game.fps);
			}
		});
		addLoc('Reflective blessing!');
		decay.getReflectiveBlessingPopup = function(mult, toEarn) {
			return '<div style="font-size: 80%;">' + loc('Reflective blessing!') + '</div>' + (Game.cookies < (mult * Game.cookiesPs * 360) ?
				'<div>' + loc('Cookies doubled!') + '</div><div style="font-size: 60%;">(' + loc('+%1!', loc('%1 cookie', Beautify(toEarn))) + ')</div>' :
				'<div>' + loc('+%1!', loc('%1 cookie', Beautify(toEarn))) + '</div><div style="font-size: 60%;">(' + loc('CpS too low to double') + ')</div>');
		}
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`Game.cookies*0.15,Game.cookiesPs*60*15`, `Game.cookies*0.33,Game.cookiesPs*60*15`).replace(`else if (choice=='cookie storm drop')`, `else if (choice=='reflective blessing') { decay.triggerNotif('shinySoulEffect'); const toEarn = Math.min(Game.cookies, mult * Game.cookiesPs * 360) + 13; Game.Earn(toEarn); Game.Popup(decay.getReflectiveBlessingPopup(mult, toEarn), me.x, me.y); } else if (choice=='cookie storm drop')`).replace('this.last=choice;', 'if (choice != "reflective blessing") this.last=choice;'));
		decay.indicator = Crumbs.spawn({
			id: 'soulClaimIndicator',
			width: 2 * 72,
			height: 2 * 72, //intentionally slightly smaller than the actual claim range
			lastActive: 1000,
			lastClaiming: 10000,
			direction: 1,
			behaviors: [Crumbs.objectBehaviors.centerOnBigCookie, new Crumbs.behaviorInstance(function() {
				this.lastActive++;
				this.lastClaiming++;
				this.alpha = Math.max(1 - this.lastActive / (1 * Game.fps), 0);
				//if (decay.grabbedObj.length) { this.noDraw = false; } else { this.noDraw = true; }
				if (decay.grabbedObj.length && decay.grabbedObj[0].id != 'thunderMarker' && decay.grabbedObj[0].id != 'pe') { this.lastActive = 0; }
				this.rotation += this.direction * Math.PI / 10 / Game.fps * Math.max(4 - 3 * this.lastClaiming / (1 * Game.fps), 1);
				for (let i in decay.grabbedObj) {
					if (decay.grabbedObj[i] && Crumbs.h.inOval(decay.grabbedObj[i].x - this.x, decay.grabbedObj[i].y - this.y, this.width / 2, this.height / 2, 0, 0, this.rotation)) { this.lastClaiming = 0; break; } 
				}
			})],
			components: new Crumbs.component.canvasManipulator({
				function: function (m, ctx) {
					//ctx.globalAlpha = m.alpha;
					ctx.beginPath();
					ctx.setLineDash([8, 5]); 
					ctx.arc(0, 0, m.width / 2, 0, 2 * Math.PI);
					ctx.strokeStyle = 'white';
					ctx.lineWidth = 2; 
					ctx.stroke();
				}
			}),
			scope: 'left'
		});
		decay.soulClaimCount = 0;
		decay.soulClaimCountLocal = 0;
		decay.shinySoulClaimCount = 0;
		decay.shinySoulClaimCountLocal = 0;
		decay.soulClaimAuraPower = 0;
		decay.shinySoulClaimAuraPower = 0;
		decay.soulClaimAuraBehavior = new Crumbs.behavior(function() {
			this.currentSize += this.expandSpeed;
			this.expandSpeed *= this.expandFriction;
			this.currentWidth -= this.thinningSpeed;
			this.thinningSpeed += this.thinningAcceleration;
			if (this.afterimages && Game.T % this.afterimageInterval == 0 && this.expandSpeed * Game.fps > this.currentWidth) {
				const h = Crumbs.spawnVisible(decay.soulClaimAuraTemplate, this.afterimages);
				h.currentWidth = this.currentWidth;
				h.currentSize = this.currentSize;
			}
			if (this.currentWidth <= 0) { this.die(); }
		});
		decay.soulClaimAuraFunction = function(m, ctx) {
			ctx.beginPath();
			ctx.arc(0, 0, m.currentSize, 0, Math.PI * 2, false);
			ctx.strokeStyle = m.color;
			ctx.lineWidth = m.currentWidth;
			ctx.stroke();
			//ctx.closePath();
		}
		decay.soulClaimAuraTemplate = {
			scope: 'left',
			behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.centerOnBigCookie), new Crumbs.behaviorInstance(decay.soulClaimAuraBehavior)],
			components: new Crumbs.component.canvasManipulator({ function: decay.soulClaimAuraFunction }),
			order: 100,
			color: '#fff',
			expandSpeed: 400 / Game.fps,
			expandFriction: 0.75,
			thinningSpeed: 12 / Game.fps,
			thinningAcceleration: 6 / Game.fps,
			currentSize: 128,
			currentWidth: 10
		}
		decay.soulClaimAuraBehaviorPure = [new Crumbs.behaviorInstance(decay.soulClaimAuraBehavior)];
		decay.createSoulClaimAura = function(soul) {
			const s = soul.shiny;
			const o = {
				color: (s?'#fffd7b':'#7bf6ff'),
				expandSpeed: ((s?512:384) + 16 * (soul.shiny?decay.shinySoulClaimAuraPower:decay.soulClaimAuraPower)) / Game.fps,
				expandFriction: (s?0.85:0.75),
				thinningSpeed: (s?1:12) / Game.fps,
				thinningAcceleration: (s?1:6) / (1 + (soul.shiny?decay.shinySoulClaimAuraPower:decay.soulClaimAuraPower) / 10) / Game.fps,
			};
			Crumbs.spawnVisible(decay.soulClaimAuraTemplate, o);
			if (soul.shiny) {
				o.expandSpeed *= 0.25;
				o.expandFriction = 0.9;
				o.currentWidth = 5;
				o.currentSize = 12;
				Crumbs.spawnVisible(decay.soulClaimAuraTemplate, o);
			}
			if (soul.shiny) {
				decay.shinySoulClaimAuraPower += 0.5 * Game.fps;
			} else {
				decay.soulClaimAuraPower += 0.3 * Game.fps;
			}
		}
		decay.updateSoulClaimAuraPowers = function() {
			if (decay.soulClaimAuraPower > 0) {
				decay.soulClaimAuraPower -= Math.max(decay.times.sinceSoulClaim - Game.fps, 0) / Game.fps / 4;
				decay.soulClaimAuraPower = Math.max(decay.soulClaimAuraPower, 0);
			} 
			if (decay.shinySoulClaimAuraPower > 0) {
				decay.shinySoulClaimAuraPower -= Math.max(decay.times.sinceSoulClaim - Game.fps, 0) / Game.fps / 4;
				decay.shinySoulClaimAuraPower = Math.max(decay.shinySoulClaimAuraPower, 0);
			}
		}
		Game.registerHook('logic', decay.updateSoulClaimAuraPowers);
		decay.shinySoulConnectLineFunction = function(m, ctx) {
			ctx.beginPath();
			ctx.lineWidth = m.lineWidth;
			ctx.strokeStyle = m.color;
			m.lineWidth -= m.decreaseRate;
			if (m.lineWidth <= 0) { m.die(); }
			ctx.moveTo(m.originX, m.originY);
			ctx.lineTo(m.targetX, m.targetY);
			ctx.stroke();
		}
		decay.shinySoulConnectLineTemplate = {
			scope: 'foreground',
			components: new Crumbs.component.canvasManipulator({
				function: decay.shinySoulConnectLineFunction
			}),
			originX: 0,
			originY: 0,
			lineWidth: 5,
			decreaseRate: 3.5 / Game.fps,
			color: '#fffd7b'
		}
		decay.createShinySoulConnectLines = function(targetX, targetY) {
			Crumbs.spawn(decay.shinySoulConnectLineTemplate, {
				originX: Crumbs.getCanvasByScope('left').canvas.parentNode.offsetWidth / 2,
				originY: Crumbs.getCanvasByScope('left').canvas.parentNode.offsetHeight * 0.4,
				targetX: targetX,
				targetY: targetY
			});
		}
		decay.saveMaterialCounts = function() {
			return decay.soulClaimCount + ',' + decay.shinySoulClaimCount + ',' + decay.bombersPopped + ',' + decay.fuse + ',' + decay.soulClaimCountLocal + ',' + decay.shinySoulClaimCountLocal + ',' + decay.bombersPoppedLocal + ',' + decay.phantomEssenceUseCount + ',' + decay.phantomEssenceUsedLocal;
		}
		decay.loadMaterialCounts = function(str) {
			str = str.split(',');
			if (isv(str[0])) { decay.soulClaimCount = parseFloat(str[0]); }
			if (isv(str[1])) { decay.shinySoulClaimCount = parseFloat(str[1]); }
			if (isv(str[2])) { decay.bombersPopped = parseFloat(str[2]); }
			if (isv(str[3])) { decay.fuse = parseFloat(str[3]); }
			if (isv(str[4])) { decay.soulClaimCountLocal = parseFloat(str[4]); }
			if (isv(str[5])) { decay.shinySoulClaimCountLocal = parseFloat(str[5]); }
			if (isv(str[6])) { decay.bombersPoppedLocal = parseFloat(str[6]); }
			if (isv(str[7])) { decay.phantomEssenceUseCount = parseFloat(str[7]); }
			if (isv(str[8])) { decay.phantomEssenceUsedLocal = parseFloat(str[8]); }

			if (decay.shinySoulClaimCount > 0) { decay.utenglobeUnlocked = true; }
			if (decay.phantomEssenceUseCount > 0) { decay.utenglobeStorage.phantomEssence.unlocked = true; }
		}
		decay.lumpToyCollectibleBehavior = function() {
			const height = this.scope.l.offsetHeight;

			if ((!this.getComponent('pointerInteractive').hovered) 
			&& this.getComponent('pointerInteractive').click 
			&& (this.scope.mouseX > this.scope.l.offsetWidth || this.scope.mouseX < 0)) {
				this.getComponent('pointerInteractive').onRelease.call(this);
			}

			//friction & milk physics
			if (this.y >= height * (1 - Game.milkHd) + 8) {
				this.xd *= 0.9;
				this.yd *= 0.9;
				this.rd *= 0.9;

				this.yd -= 60 / Game.fps;
			} else {
				this.xd *= 0.975;
				this.yd *= 0.975;
				this.rd *= 0.975;
			}

			this.yd *= (Math.min(1, Math.abs(this.y - (height - (Game.milkHd) * height) / 16))); //thanks orteil
			this.rd += this.xd * 0.01 + this.yd * 0.002;

			if (this.grabbed) {
				this.xd += ((this.scope.mouseX - this.x) * 2 - this.xd) * 0.3;
				this.yd += ((this.scope.mouseY - this.y) * 2 - this.yd) * 0.3;

				this.x = this.scope.mouseX;
				this.y = this.scope.mouseY;

				this.rd *= 0.9;
			}

			const radii = this.scaleX * this.width * 0.5 * 0.75;
			if (this.x > this.scope.l.offsetWidth - radii) {
				this.x = this.scope.l.offsetWidth - radii;
				this.xd *= -0.1;
				this.rd *= 0.2;
			} else if (this.x < radii) {
				this.x = radii;
				this.xd *= -0.1;
				this.rd *= 0.2;
			}

			if ((this.x - Game.cookieOriginX)**2 + (this.y - Game.cookieOriginY)**2 < 6400) { 
				this.inAura += 30 / Game.fps; 
				if (Game.T % 3 == 0) {
					Crumbs.spawnFallingCookie(this.x, this.y, Math.random()*-2-2, Math.random()*4-2, 1.5, 'lumpSmall', false, 0.75 * this.alpha, 2, true, [23 + Math.floor(Math.random() * 2), 14]);
				}
			} else {
				this.inAura = 0;
			} 
			this.alpha = Math.pow(((5 * Game.fps) - this.inAura) / (5 * Game.fps), 0.7);
			if (this.inAura > 5 * Game.fps) { 
				this.die(); 
				this.getComponent('pointerInteractive').onRelease.call(this);
				for (let i = 0; i < 15; i++) {
					Crumbs.spawnFallingCookie(this.x, this.y, Math.random()*-10+2, Math.random()*10-5, 2, 'lumpSmall', false, Math.random() * 0.5 + 0.75, 2, true, [23 + Math.floor(Math.random() * 2), 14]);
				}
				if (Game.Has('Golden sugar')) { Game.gainBuff('frenzy',100,7); }
				decay.claimLump(this);
			}

			//gravity
			if (!this.grabbed) { this.yd += 30 / Game.fps; }

			this.x += this.xd;
			this.y += this.yd;
			this.rotation += this.rd;
		}
		decay.lumpToyPulsateTemplate = {
			imgs: 'icons.png',
			order: -1,
			alpha: 0.5,
			width: 48,
			height: 48,
			behaviors: new Crumbs.behaviorInstance(function() {
				this.scaleX = 1.05 + 0.15 * Math.sin((Crumbs.t - this.t) / 37);
				this.scaleY = 1.05 + 0.15 * Math.sin((Crumbs.t - this.t) / 37);
				this.alpha = (0.4 + 0.25 * Math.cos((Crumbs.t - this.t) / 67)) * this.parent.alpha;
			})
		}
		decay.lumpToyCollectibleInit = function() {
			if (!Game.prefs.fancy) { return; }
			this.spawnChild(decay.lumpToyPulsateTemplate, {
				sx: this.sx,
				sy: this.sy
			});
		}
		decay.lumpToyCollectibleTemplate = {
			width: 48, 
			height: 48,
			id: 'lump',
			imgs: ['icons.png'],
			scope: 'left',
			sx: 29 * 48,
			sy: 0,
			scaleX: 1.1,
			scaleY: 1.1,
			order: 4,
			behaviors: new Crumbs.behaviorInstance(decay.lumpToyCollectibleBehavior),
			init: decay.lumpToyCollectibleInit,
			grabbed: false,
			inAura: 0,
			xd: 0,
			yd: 0,
			rd: 0,
			components: new Crumbs.component.pointerInteractive({ boundingType: 'oval', onClick: function() { if (decay.grabbedObj.length) { return; } this.grabbed = true; decay.grabbedObj.push(this); }, onRelease: function() { this.grabbed = false; if (decay.grabbedObj.includes(this)) { decay.grabbedObj.splice(decay.grabbedObj.indexOf(this), 1); } } })
		}
		decay.saveLumpToys = function() {
			const all = Crumbs.getObjects('lump');
			let str = '';
			for (let i in all) {
				str += all[i].x + '-' + all[i].y + '-' + all[i].type + ',';
			}
			return str.slice(0, str.length - 1);
		}
		decay.loadLumpToys = function(str) {
			const prev = Crumbs.getObjects('lump');
			for (let i = prev.length - 1; i >= 0; i--) { 
				prev[i].die();
			}
			const strs = str.split(',');
			for (let i in strs) {
				if (!isv(strs[i])) { continue; }
				const a = strs[i].split('-');
				const x = isv(a[0])?parseFloat(a[0]):0;
				const y = isv(a[1])?parseFloat(a[1]):0;
				const type = isv(a[2])?parseFloat(a[2]):1;
				Crumbs.spawn(decay.lumpToyCollectibleTemplate, { 
					type: type, 
					sy: decay.getLumpIconYPos(6, type) * 48, 
					rotation: Math.random() * Math.PI * 2, 
					x: x, 
					y: y
				});
			}
		}
		decay.phantomCertifiedWrinklerSelect = null; //workaround because I would prefer NOT creating children and not setting random stuff in wrinklers
		decay.phantomEssenceBehavior = new Crumbs.behavior(function() {
			this.xd *= Math.pow(0.12, 1 / Game.fps);
			this.yd *= Math.pow(0.12, 1 / Game.fps);
			this.x += this.xd / Game.fps;
			this.y += this.yd / Game.fps;
			if (this.grabbed) {
				this.xd += (this.scope.mouseX - this.x) * 15;
				this.yd += (this.scope.mouseY - this.y) * 15;
				this.x = this.scope.mouseX;
				this.y = this.scope.mouseY;
			}
			this.scaleX = 0.03 + 0.01 * Math.sin(Game.T / 300);
			this.scaleY = 0.03 + 0.01 * Math.sin(Game.T / 300);
			if (this.x < 0) {
				this.x = 0;
				this.xd *= -0.75;
			}
			if (this.x > this.scope.l.width) {
				this.x = this.scope.l.width;
				this.xd *= -0.75;
			}
			if (this.y < 0) {
				this.y = 0;
				this.yd *= -0.75;
			}
			if (this.y > this.scope.l.height) {
				this.y = this.scope.l.height;
				this.yd *= -0.75;
			}

			if (this.grabbed) { 
				decay.phantomCertifiedWrinklerSelect = decay.findHoveringWrinkler();
			}
		});
		decay.phantomEssenceUseCount = 0;
		decay.phantomEssenceUsedLocal = 0;
		decay.phantomEssenceTemplate = {
			imgs: [kaizoCookies.images.glow], //placeholder
			x: 100,
			y: 100,
			xd: 0,
			yd: 0,
			scaleX: 0.08,
			scaleY: 0.08,
			order: 99,
			id: 'pe',
			grabbed: false,
			scope: 'left',
			inMilk: 0,
			behaviors: [new Crumbs.behaviorInstance(decay.phantomEssenceBehavior), new Crumbs.behaviorInstance(decay.wSoulDeposit, { target: 'phantomEssence' })],
			components: new Crumbs.component.pointerInteractive({ 
				boundingType: 'oval', 
				onClick: function() { if (decay.grabbedObj.length) { return; } this.grabbed = true; decay.grabbedObj.push(this); }, 
				onRelease: function() { 
					this.grabbed = false; 
					decay.phantomCertifiedWrinklerSelect = null;
					if (decay.grabbedObj.includes(this)) { 
						decay.grabbedObj.splice(decay.grabbedObj.indexOf(this), 1); 
					} 
					const w = decay.findHoveringWrinkler();
					if (!w) { return; }
					if (w.phantom) {
						Crumbs.spawn(decay.phantomPullerTemplate, {
							target: w,
							radius: 100,
							strength: 0.01,
							hurtSet: 160,
							duration: 20,
							durationMax: 20,
						});
					} else {
						Crumbs.spawn(decay.phantomPullerTemplate, {
							target: w,
							radius: 0,
							strength: 0.06,
							hurtSet: 240,
							duration: 16,
							durationMax: 16
						});
					}
					decay.phantomEssenceUseCount++;
					decay.phantomEssenceUsedLocal++;
					decay.utenglobeStorage.phantomEssence.unlocked = true;
					this.die();
				} 
			})
		}
		decay.phantomPullerTemplate = {
			//these are all single target parameters
			target: null,
			duration: 16, //seconds
			durationMax: 16,
			radius: 0, //if 0, single target
			strength: 0.06,
			hurtSet: 240,
			init: function() {
				this.durationMax = this.duration;
			},
			behaviors: new Crumbs.behaviorInstance(function() {
				this.duration -= 1 / Game.fps;
				if (this.duration < 0 || this.target.died) { this.die(); }

				if (!this.target) { return; }

				const mult = Math.pow(Math.max(this.duration / this.durationMax, 0), 0.4);

				this.target.hurt = Math.max(this.target.hurt, this.hurtSet * mult);
				this.target.dist += this.strength * mult / Game.fps;

				if (this.radius) {
					for (let i = 0; i < 2; i++) {
						const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
						const r = Math.sqrt(Math.random()) * (this.radius + 50);
						const [pxp, pyp] = Crumbs.h.rv(-this.target.rotation, 0, 100);
						const px = this.target.getTrueX() + Math.cos(angle) * r + pxp;
						const py = this.target.getTrueY() + Math.sin(angle) * r + pyp;
						const a = Crumbs.spawnParticle(decay.phantomWindParticle, px, py, this.target.rotation, 0.6, 'left');
						a.direction = this.target.rotation + Math.PI / 2;
					}
				} else if (Game.T % 2) {
					const display = this.target.findChild('wc');
					const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
					const r = Math.sqrt(Math.random());
					const rot = display.getTrueRotation();
					const [pxp, pyp] = Crumbs.h.rv(-rot, 0, Crumbs.getPHeight(display) / 2);
					const [rotatedX, rotatedY] = Crumbs.h.rv(-rot, Math.cos(angle) * r * Crumbs.getPWidth(display) / 2, Math.sin(angle) * r * Crumbs.getPHeight(display) / 2);
					const px = pxp + this.target.getTrueX() + rotatedX;
					const py = pyp + this.target.getTrueY() + rotatedY;
					const a = Crumbs.spawnParticle(decay.phantomWindParticle, px, py, this.target.rotation, 0.6, 'left');
					a.direction = this.target.rotation + Math.PI / 2;
				}

				if (!this.radius) { return; }

				const all = Crumbs.getObjects('w');
				for (let i in all) {
					if (!(Crumbs.h.inOval(this.target.getTrueX(), this.target.getTrueY(), Crumbs.getPWidth(all[i]) / 2, Crumbs.getPHeight(all[i]) / 2, all[i].getTrueX(), all[i].getTrueY(), all[i].getTrueRotation()) || 
						decay.wrinklerInDist(all[i], this.radius * this.radius, this.target.x, this.target.y))) {
						continue;
					};

					all[i].hurt = Math.max(all[i].hurt, this.hurtSet * mult);
					all[i].dist += this.strength * mult / Game.fps;
				}
			})
		};
		decay.phantomWindParticle = {
			img: kaizoCookies.images.windParticle,
			width: 0,
			height: 48,
			direction: 0,
			speed: 600,
			alpha: 0.9,
			life: 0.25 * Game.fps,
			behavior: function() {
				this.width = Math.sin(this.life / (0.25 * Game.fps) * Math.PI) * 6;
				this.x += Math.cos(this.direction) * this.speed / Game.fps;
				this.y += Math.sin(this.direction) * this.speed / Game.fps;
			},
			reusePool: Crumbs.newReusePool()
		};
		replaceDesc('Wrinkler doormat', 'Wrinklers no longer spawn.<q>Quite possibly the cleanest doormat one will ever see.</q>');
		replaceDesc('Unholy bait', 'Your clicks are <b>20%</b> more effective against wrinklers. Wrinklers are <b>10%</b> slower.<q>A nice snack to distract them during the OBLITERATION.</q>');
		replaceDesc('Wrinklerspawn', 'Wrinklers are <b>5%</b> slower.<q>Really, it just makes the big cookie seem more crowded than it actually is.</q>');
		replaceDesc('Sacrilegious corruption', 'Wrinklers have a <b>10%</b> chance to drop <b>two</b> souls instead of one.<q>Ah yes, mankind\'s best friend: words.</q>');
		replaceDesc('Elder spice', 'While exhausted, wrinkler souls halt decay for <b>10%</b> longer..<q>What a lovely smell!</q>');
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var xBase=0;', 'decay.updateWrinklers(); return;'));
		Game.suckingCount = 0;
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('var suckRate=1/20;', 'var suckRate=1/2; sucking = decay.compileSucking();').replace('Game.cpsSucked=Math.min(1,sucking*suckRate);', 'Game.cpsSucked=1 - Math.min(1,Math.pow(suckRate, sucking));Game.suckingCount = sucking;'));
		Game.registerHook('cookiesPerClick', function(val) { return val * (1 - Game.cpsSucked); }); //withering affects clicking
		Game.getWrinklersMax = function() {
			return 2;
		}
		Game.Objects['Grandma'].sellFunction = function() { Game.Win('Just wrong'); }
		addLoc('First Chance to Suffer');
		addLoc('Burst the especially insufferable <b>shiny wrinkler</b>.<q>What a good citizen!</q>');
		Game.Achievements['Last Chance to See'].dname = loc('First Chance to Suffer'); 
		Game.Achievements["Last Chance to See"].name= loc('First Chance to Suffer');
		replaceAchievDesc('Last Chance to See', loc('Burst the especially insufferable <b>shiny wrinkler</b>.<q>What are you even doing?</q>'));
		Game.Achievements["Last Chance to See"].pool = "normal";
		Game.Achievements["Last Chance to See"].order = 21000.262;
		replaceAchievDesc('Wrinkler poker', 'Have at least <b>52</b> wrinklers on-screen simultaneously.<div class="line"></div>Obtaining this achievement also <b>obliterates all wrinklers</b>.<q>Also the name of a person known for being spontaneous and (possibly) annoying to their friends.</q>');
		eval('Game.WriteSave='+Game.WriteSave.toString().replace('Math.floor(wrinklers.number)', '0'));
		addLoc('Wrinkler souls claimed:');
		addLoc('Shiny wrinkler souls claimed:');
		addLoc('Bombers popped:');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
			.replace(`(Game.wrinklersPopped>0?'<div class="listing"><b>'+loc("Wrinklers popped:")+'</b> '+Beautify(Game.wrinklersPopped)+'</div>':'')+`, 
				`(decay.wrinklersPoppedTotal>0?'<div class="listing"><b>'+loc("Wrinklers popped:")+'</b> '+Beautify(Game.wrinklersPopped)+' <small>('+loc('total: ')+Beautify(decay.wrinklersPoppedTotal)+')</small></div>':'')+
				(decay.soulClaimCount>0?'<div class="listing"><b>'+loc("Wrinkler souls claimed:")+'</b> '+Beautify(decay.soulClaimCountLocal)+' <small>('+loc('total: ')+Beautify(decay.soulClaimCount)+')</small></div>':'')+
				(decay.shinySoulClaimCount>0?'<div class="listing"><b>'+loc("Shiny wrinkler souls claimed:")+'</b> '+Beautify(decay.shinySoulClaimCountLocal)+' <small>('+loc('total: ')+Beautify(decay.shinySoulClaimCount)+')</small></div>':'')+
				(decay.bombersPopped>0?'<div class="listing"><b>'+loc("Bombers popped:")+'</b> '+Beautify(decay.bombersPoppedLocal)+' <small>('+loc('total: ')+Beautify(decay.bombersPopped)+')</small></div>':'')+`)
		);
		decay.removeAllWrinklers = function() {
			let wrinklers = Crumbs.getObjects('w', 'left');
			for (let i in wrinklers) {
				wrinklers[i].die();
			}
		}
		decay.removeAllWrinklerSouls = function() {
			let wrinklerSouls = Crumbs.getObjects('s', 'left');
			for (let i in wrinklerSouls) { 
				wrinklerSouls[i].die(); 
			}
		}
		Game.saveAllWrinklers = function() {
			let str = '';
			let wrinklers = Crumbs.getObjects('w', 'left');
			for (let i in wrinklers) {
				const me = wrinklers[i];
				let str2 = me.dist + '_' + me.rad + '_' + me.sucked.toFixed(8) + '_' + me.size + '_' + me.explosionProgress + '_' + me.speedMult + '_' + me.hp + '_';
				if (me.shiny) { str2 += 's'; }
				if (me.leading) { str2 += 'l'; }
				if (me.bomber) { str2 += 'b'; }
				if (me.armored) { str2 += 'a'; }
				if (me.phantom) { str2 += 'p'; }
				str2 += '_' + me.damageMult + '_';
				if (me.lumpCarrying) { str2 += me.lumpCarrying; }
				str += str2;
				str += ',';
			}
			if (str) { str = str.slice(0, str.length - 1); }
			return str;
		}
		Game.loadAllWrinklers = function(str) {
			if (!str) { return; }
			let arr = str.split(',');
			loop:
			for (let i in arr) {
				let param = arr[i].split('_');
				for (let ii = 0; ii < param.length; ii++) {
					if (ii == 7 || ii == 9) { continue; }
					if (isv(param[ii])) { param[ii] = parseFloat(param[ii]); } else { continue loop; }
				}
				let obj = {
					dist: param[0],
					rad: param[1],
					sucked: param[2],
					size: param[3],
					explosionProgress: param[4],
					speedMult: param[5],
					hp: param[6],
					lumpCarrying: parseInt(param[9]) || null
				};
				if (param[7].includes('s')) { obj.shiny = true; }
				if (param[7].includes('l')) { obj.leading = true; }
				if (param[7].includes('b')) { obj.bomber = true; }
				if (param[7].includes('a')) { obj.armored = true; }
				if (param[7].includes('p')) { obj.phantom = true; }
				obj.damageMult = param[8] || 1;
				let me = decay.spawnWrinkler(obj);
			}
			decay.recalculateLumpCarriers();
		}

		//utenglobe below
		//yay new pet!!!
		decay.utenglobeUnlocked = false; //condition: must have claimed at least 1 shiny soul in this save
		Crumbs.createPet({
			special: 'utenglobe',
			image: kaizoCookies.images.utenglobe,
			skinFunction: function() {},
			enableCondition: function() { return decay.utenglobeUnlocked; }
		});
		eval('Game.UpdateSpecial='+Game.UpdateSpecial.toString().replace(`if (Game.Has('A crumbly egg')) Game.specialTabs.push('dragon');`, `if (Game.Has('A crumbly egg')) Game.specialTabs.push('dragon'); if (decay.shinySoulClaimCount>0) Game.specialTabs.push('utenglobe');`));
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace(
			`else {pic='dragon.png?v='+Game.version;frame=4;}`, 
			`else if (Game.specialTab=='utenglobe') { pic=kaizoCookies.images.utenglobe; frame=decay.getUtenglobeFrame(); } else {pic='dragon.png?v='+Game.version;frame=4;}`
		).replace(
			`background:url('+Game.resPath+'img/'+pic+')`, 
			`background:url('+pic+')`
		).replace(`pic='santa.png?v='`, `pic=Game.resPath+'img/santa.png?v='`).replace(`pic='dragon.png?v='`, `pic=Game.resPath+'img/dragon.png?v='`)
		.replace(`Game.ToggleSpecialMenu(0);">x</div>';`, `Game.ToggleSpecialMenu(0);">x</div>'; if (Game.specialTab == 'utenglobe') { str += decay.utenglobeOpen(); }`)
		.replace(`l('specialPopup').className='framed prompt onScreen';`, `l('specialPopup').className='framed prompt onScreen'; if (l('fuseAmount')) { decay.fuseAmountEle = l('fuseAmount'); }`)
		.replace(`if (on`, `if (on && !(!decay.gameCan.interactUtenglobe && Game.specialTab == 'utenglobe')`)
		.replace(`if (Game.specialTab!=''`, `if (Game.specialTab!='' && !(!decay.gameCan.interactUtenglobe && Game.specialTab == 'utenglobe')`));
		decay.getUtenglobeFrame = function() { return 0; }
		decay.fuse = 0; //goes from 0 to 100, canonically a material
		decay.fuseDischargePoint = 60;
		decay.fuseOverflowPoint = 100;
		decay.accumulateFuse = function(amount) {
			if (Game.cookiesEarned < decay.featureUnlockThresholds.fuse || decay.shattered || decay.shatterFuseDrain) { return; }
			if (decay.fuse + amount >= decay.fuseDischargePoint && !decay.fuse >= decay.fuseDischargePoint) { Game.Notify('Fuse discharge unlocked!', '', 0, 6); }
			decay.fuse += amount;
			if (decay.fuse >= decay.fuseOverflowPoint) { decay.tryDischarge(); }
			decay.updateUtenglobe();
		}
		decay.shattered = 0; //also functions as timer
		decay.shatterManifestation = 1; //mult
		decay.shatterFuseDrain = null; //TCount
		decay.shatterBegin = 15 * Game.fps;
		decay.tryDischarge = function() {
			if (decay.fuse < decay.fuseDischargePoint) { return; }
			decay.shatterFuseDrain = Game.TCount;
			decay.updateUtenglobe();
		}
		decay.fuseAmountEle = null;
		decay.updateFuse = function() {
			if (decay.shatterFuseDrain) {
				decay.fuse -= ((Game.TCount - decay.shatterFuseDrain) / Game.fps / 5);
				if (decay.fuse <= 0) {
					decay.fuse = 0;
					decay.shatterFuseDrain = null;
					decay.shattered = 20 * Game.fps;
					decay.updateUtenglobe();
					Game.Notify('Decay is shattered!', '', 0, 6);
				}
			}
			if (decay.shattered) {
				decay.shattered -= Math.max(decay.gen, 1);
				if (decay.fuseAmountEle) { decay.fuseAmountEle.innerHTML = loc('(recovery: %1%)', Beautify((1 - decay.shattered / decay.shatterBegin) * 100, 1)); }
				let frame = (Game.T / (Game.fps * 6));
				let color = null;
				if (Math.floor(frame) % 2) { 
					color = colorCycleFrame([255, 95, 46], [255, 29, 135], (frame % 1));
				} else {
					color = colorCycleFrame([255, 29, 135], [255, 95, 46], (frame % 1));
				}

				decay.shatterManifestation = 2.5;

				l('shatteredDecayText').style.color = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
				if (decay.shattered <= 0) {
					decay.shattered = 0;
					decay.updateUtenglobe();
					decay.shatterManifestation = 1;
				}
			}
			if (decay.fuseAmountEle && decay.shatterFuseDrain != null) { 
				decay.fuseAmountEle.innerHTML = Beautify(Math.min(decay.fuse, 100), 1) + '%'; 
				decay.fuseAmountEle.style.color = decay.getFuseTextColor();
			}
		}
		decay.fuseTextColorFrames = [[255, 237, 41], [255, 95, 46], [255, 29, 135]]; //['#ffed29', '#ff5f2e', '#ff1d87'] stealing colors lets go
		decay.getFuseTextColor = function() {
			if (decay.fuse < decay.fuseDischargePoint) { return '#fff'; }
			else if (decay.fuse >= decay.fuseOverflowPoint) { return '#ff1d87'; }
			const frac = (decay.fuse-decay.fuseDischargePoint)/(decay.fuseOverflowPoint-decay.fuseDischargePoint);
			const frame = Math.floor(frac*3);
			const color = colorCycleFrame(decay.fuseTextColorFrames[frame], decay.fuseTextColorFrames[Math.min(frame+1, 2)], (frac * 3) % 1);
			return 'rgb('+color[0]+','+color[1]+','+color[2]+')';
		}
		decay.getFuseAmountDisplay = function() {
			return loc('Fuse: %1', '<span id="fuseAmount" style="color: '+decay.getFuseTextColor()+'; font-weight: bold; font-size: 13px;">' + Beautify(decay.fuse, 1) + '%</span>') + ((decay.shatterFuseDrain || decay.fuse < decay.fuseDischargePoint)?'':(' ' + loc('(click to discharge!)')));
		}
		addLoc('expend'); addLoc('upgrade'); addLoc('incubate'); addLoc('conjure');
		addLoc('Click to release one, or shift-ctrl-click to release all at once.');
		addLoc('Fuse: %1'); addLoc('(click to discharge!)'); addLoc('Decay is shattered!'); addLoc('(recovery: %1%)'); 
		addLoc('Toggle this on to have released souls autonomously fly into the big cookie. (green = on)');
		addLoc('Click this to trade <b>%1</b> normal wrinkler souls in your storage for <b>%2</b> shiny wrinkler soul.');
		addLoc('<b>Cannot use</b> (not enough normal souls!)');
		addLoc('Toggle this on to make releasing souls convert it into <b>%1%</b> of its power instead.');
		addLoc('Click this to release one phantom essence fixed to your mouse. (Hotkey: Ctrl + Q)');
		decay.utenglobeAutoClaim = true;
		decay.utenglobeAutoClaimTooltip = function() { return '<div style="min-width: 200px; padding: 6px; text-align: center;">'+loc('Toggle this on to have released souls autonomously fly into the big cookie. (green = on)')+'</div>'; }
		decay.shinyCondenserUnlocked = false;
		decay.utenglobeShinyCondenserTooltip = function() { return '<div style="min-width: 200px; padding: 6px; text-align: center;">'+(decay.utenglobeStorage.soul.amount<5?loc('<b>Cannot use</b> (not enough normal souls!)')+'<div class="line"></div>':'')+loc('Click this to trade <b>%1</b> normal wrinkler souls in your storage for <b>%2</b> shiny wrinkler soul.', [decay.shinyCondenserUpgrades?5:8, 1])+'</div>'; }
		decay.utenglobePowerchanneling = false;
		decay.utenglobePowerchannelEff = 2;
		decay.utenglobePowerchannelTooltip = function() { return '<div style="min-width: 200px; padding: 6px; text-align: center;">'+loc('Toggle this on to make releasing souls convert it into <b>%1%</b> of its power instead.', Beautify(decay.utenglobePowerchannelEff * 100, 1))+'</div>'; }
		decay.utenglobeQuickReleaseTooltip = function() { return '<div style="min-width: 200px; padding: 6px; text-align: center;">'+loc('Click this to release one phantom essence fixed to your mouse. (Hotkey: Ctrl + Q)')+'</div>'; }
		AddEvent(document, 'keydown', function(e) {
			if (decay.quickReleaseUnlocked && e.ctrlKey && e.key.toLowerCase() == 'q') {
				decay.quickRelease();
			}
		});
		decay.utenglobeTab = 0;
		decay.allUtenglobeTabs = [
			{ 
				text: loc('expend'),
				details: function() {
					let str = '';
					let unlockCount = 0;
					for (let i in decay.utenglobeStorage) {
						if (decay.utenglobeStorage[i].unlocked) { unlockCount++; }
					}
					for (let i in decay.utenglobeStorage) {
						str += decay.utenglobeStorage[i].getButton(unlockCount==3?6:10);
					}
					str += '<div id="utenglobeAutoClaimElement" class="option framed utenglobeAutoClaimToggle" '+Game.getDynamicTooltip('decay.utenglobeAutoClaimTooltip', 'top', true)+Game.clickStr+'="if (decay.gameCan.toggleAutoClaim) { decay.utenglobeAutoClaim=!decay.utenglobeAutoClaim; l(\'utenglobeAutoClaimElement\').style.background=(decay.utenglobeAutoClaim?\'#1e3\':\'#000\'); }" style="background: '+(decay.utenglobeAutoClaim?'#1e3':'#000')+'">';
					str += '<svg version="1.1" viewBox="0.0 0.0 480.0 480.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><clipPath id="p.0"><path d="m0 0l480.0 0l0 480.0l-480.0 0l0 -480.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#p.0)"><path fill="#000000" fill-opacity="0.0" d="m0 0l480.0 0l0 480.0l-480.0 0z" fill-rule="evenodd"/><path fill="#ffffff" d="m74.247475 43.05654l111.02363 111.02363l40.65628 -40.65629l0 113.00788l-113.00788 0l40.656273 -40.65628l-111.02362 -111.02362z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m74.247475 43.05654l111.02363 111.02363l40.65628 -40.65629l0 113.00788l-113.00788 0l40.656273 -40.65628l-111.02362 -111.02362z" fill-rule="evenodd"/><path fill="#ffffff" d="m405.75238 43.05654l-111.02362 111.02363l-40.656265 -40.65629l0 113.00788l113.00789 0l-40.65628 -40.65628l111.02362 -111.02362z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m405.75238 43.05654l-111.02362 111.02363l-40.656265 -40.65629l0 113.00788l113.00789 0l-40.65628 -40.65628l111.02362 -111.02362z" fill-rule="evenodd"/><path fill="#ffffff" d="m74.247475 436.94345l111.02363 -111.02362l40.65628 40.65628l0 -113.00787l-113.00788 0l40.656273 40.65628l-111.02362 111.02362z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m74.247475 436.94345l111.02363 -111.02362l40.65628 40.65628l0 -113.00787l-113.00788 0l40.656273 40.65628l-111.02362 111.02362z" fill-rule="evenodd"/><path fill="#ffffff" d="m405.75238 436.94345l-111.02362 -111.02362l-40.656265 40.65628l0 -113.00787l113.00789 0l-40.65628 40.65628l111.02362 111.02362z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m405.75238 436.94345l-111.02362 -111.02362l-40.656265 40.65628l0 -113.00787l113.00789 0l-40.65628 40.65628l111.02362 111.02362z" fill-rule="evenodd"/></g></svg>';
					str += '</div>';
					if (decay.challengeStatus('combo4') && Game.Has('Twin Gates of Transcendence')) { 
						str += '<div id="utenglobePowerchannelElement" class="option framed utenglobePowerchannelToggle" '+Game.getDynamicTooltip('decay.utenglobePowerchannelTooltip', 'top', true)+Game.clickStr+'="if (decay.gameCan.togglePowerchannel) { decay.utenglobePowerchanneling = !decay.utenglobePowerchanneling; l(\'utenglobePowerchannelElement\').style.background=(decay.utenglobePowerchanneling?\'#1e3\':\'#000\'); }"  style="background: '+(decay.utenglobePowerchanneling?'#1e3':'#000')+'">';
						str += '<svg version="1.1" viewBox="0.0 0.0 480.0 480.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><clipPath id="p.0"><path d="m0 0l480.0 0l0 480.0l-480.0 0l0 -480.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#p.0)"><path fill="#000000" fill-opacity="0.0" d="m0 0l480.0 0l0 480.0l-480.0 0z" fill-rule="evenodd"/><path fill="#ffffff" d="m74.0 422.0l0 -204.75l0 0c0 -87.95134 71.29866 -159.25 159.25 -159.25l0 0l0 0c42.235718 0 82.74158 16.778076 112.60675 46.64324c29.865173 29.865166 46.64325 70.371025 46.64325 112.60676l0 22.75l45.5 0l-91.0 91.0l-91.0 -91.0l45.5 0l0 -22.75c0 -37.693436 -30.55658 -68.25 -68.25 -68.25l0 0l0 0c-37.693436 0 -68.25 30.556564 -68.25 68.25l0 204.75z" fill-rule="evenodd"/></g></svg>';
						str += '</div>';
					}
					if (decay.shinyCondenserUnlocked) {
						str += '<div id="utenglobeShinyCondenserElement" class="option framed utenglobeShinyCondenser" '+Game.getDynamicTooltip('decay.utenglobeShinyCondenserTooltip', 'top', true)+Game.clickStr+'="decay.shinyConvert(decay.shinyCondenserUpgrades?5:8, 1);">';
						str += '<svg version="1.1" viewBox="0.0 0.0 480.0 480.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><clipPath id="p.0"><path d="m0 0l480.0 0l0 480.0l-480.0 0l0 -480.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#p.0)"><path fill="#000000" fill-opacity="0.0" d="m0 0l480.0 0l0 480.0l-480.0 0z" fill-rule="evenodd"/><path fill="#000000" fill-opacity="0.0" d="m48.0 72.03208l211.32288 0l0 138.28006l98.47537 0l0 -54.295822l74.20175 83.98425l-74.20175 83.98425l0 -54.295807l-98.47537 0l0 138.28006l-211.32288 0z" fill-rule="evenodd"/><path stroke="#ffffff" stroke-width="24.0" stroke-linejoin="round" stroke-linecap="butt" d="m48.0 72.03208l211.32288 0l0 138.28006l98.47537 0l0 -54.295822l74.20175 83.98425l-74.20175 83.98425l0 -54.295807l-98.47537 0l0 138.28006l-211.32288 0z" fill-rule="evenodd"/><path fill="#ffffff" d="m82.62992 240.0l0 0c0 -70.8577 12.091835 -128.29921 27.007874 -128.29921l0 0c7.1629333 0 14.032494 13.517197 19.09745 37.577972c5.0649567 24.06076 7.910431 56.694168 7.910431 90.72124l0 0c0 70.8577 -12.091843 128.29922 -27.007881 128.29922l0 0c-7.1629333 0 -14.032494 -13.517212 -19.09745 -37.577972c-5.0649567 -24.060791 -7.9104233 -56.694183 -7.9104233 -90.72125z" fill-rule="evenodd"/><path stroke="#ffffff" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m82.62992 240.0l0 0c0 -70.8577 12.091835 -128.29921 27.007874 -128.29921l0 0c7.1629333 0 14.032494 13.517197 19.09745 37.577972c5.0649567 24.06076 7.910431 56.694168 7.910431 90.72124l0 0c0 70.8577 -12.091843 128.29922 -27.007881 128.29922l0 0c-7.1629333 0 -14.032494 -13.517212 -19.09745 -37.577972c-5.0649567 -24.060791 -7.9104233 -56.694183 -7.9104233 -90.72125z" fill-rule="evenodd"/><path fill="#ffffff" d="m162.77953 240.0l0 0c0 -60.716537 12.091843 -109.93701 27.007874 -109.93701l0 0c7.1629333 0 14.032501 11.582626 19.097458 32.199814c5.0649567 20.617188 7.9104156 48.580093 7.9104156 77.7372l0 0c0 60.716522 -12.091827 109.93701 -27.007874 109.93701l0 0c-7.1629333 0 -14.032486 -11.582611 -19.097443 -32.1998c-5.064972 -20.617188 -7.910431 -48.58011 -7.910431 -77.73721z" fill-rule="evenodd"/><path stroke="#ffffff" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m162.77953 240.0l0 0c0 -60.716537 12.091843 -109.93701 27.007874 -109.93701l0 0c7.1629333 0 14.032501 11.582626 19.097458 32.199814c5.0649567 20.617188 7.9104156 48.580093 7.9104156 77.7372l0 0c0 60.716522 -12.091827 109.93701 -27.007874 109.93701l0 0c-7.1629333 0 -14.032486 -11.582611 -19.097443 -32.1998c-5.064972 -20.617188 -7.910431 -48.58011 -7.910431 -77.73721z" fill-rule="evenodd"/></g></svg>';
						str += '</div>';
					}
					if (decay.quickReleaseUnlocked) {
						str += '<div id="quickReleaseElement" class="option framed utenglobeQuickRelease" '+Game.getDynamicTooltip('decay.utenglobeQuickReleaseTooltip', 'top', true)+Game.clickStr+'="decay.quickRelease();">';
						str += '<svg version="1.1" viewBox="0.0 0.0 480.0 480.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><clipPath id="p.0"><path d="m0 0l480.0 0l0 480.0l-480.0 0l0 -480.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#p.0)"><path fill="#000000" fill-opacity="0.0" d="m0 0l480.0 0l0 480.0l-480.0 0z" fill-rule="evenodd"/><path fill="#ffffff" d="m250.6911 329.34775l0 0c-58.520096 34.025146 -132.84976 22.606049 -178.45786 -27.416077c-45.608086 -50.022125 -50.131504 -125.08766 -10.860249 -180.22458c39.27125 -55.136925 111.69183 -75.39913 173.8743 -48.64747c62.182465 26.75167 97.270905 93.26558 84.24368 159.693l-141.04558 -27.660751z" fill-rule="evenodd"/><path fill="#ffffff" d="m316.17606 406.70358l-125.46457 -192.25197l224.14172 49.952744z" fill-rule="evenodd"/><path fill="#ffffff" d="m385.18875 305.0765l54.55121 39.55905l-39.559082 54.551178l-54.551178 -39.55905z" fill-rule="evenodd"/></g></svg>';
						str += '</div>';
					}
					if (decay.bombersPopped > 0 && Game.cookiesEarned > decay.featureUnlockThresholds.fuse) { //colorCycleFrame()
						if (decay.shattered) { 
							str += '<div class="fuseAmountText"><span class="shatteredDecayText" id="shatteredDecayText">'+loc('Decay is shattered!')+'</span> <span id="fuseAmount">'+loc('(recovery: %1%)', Beautify((1 - decay.shattered / decay.shatterBegin) * 100, 1))+'</span>';
						} else {
							str += '<div class="fuseAmountText'+((decay.fuse>=decay.fuseDischargePoint&&!decay.shatterFuseDrain)?' canDischarge':'')+'" '+Game.clickStr+'="decay.tryDischarge();">'+decay.getFuseAmountDisplay();
						}
					} else {
						str += '<div style="width: 100%; margin-bottom: 2px; height: 6px;"><small>' + loc('Click to release one, or shift-ctrl-click to release all at once.') + '</small>';
					}

					return str + '</div>';
				}
			}, 
			{ 
				text: loc('upgrade'),
				details: function() {
					let str = '';
					for (let i in decay.utenglobeStorage) {
						str += decay.utenglobeStorage[i].getUpgradeDesc();
					}

					return str;
				}
			}, 
			{ 
				text: loc('conjure'), 
				details: function() {
					let str = '';
					for (let i in decay.greatSoulTypes) {
						str += '<div class="block interactable" '+Game.clickStr+'="decay.greatSoulTypes[\''+i+'\'].create();">' + decay.greatSoulTypes[i].getButton() + '</div>';
					}

					return str;
				},
				unlock: function() { return decay.momentumUnlocked; } 
			}, 
			{ 
				text: loc('incubate'), 
				unlock: function() { return false; } 
			}
		];
		AddEvent(document, 'keydown', function(e) {
			if (!decay.utenglobeUnlocked || Game.specialTab != 'utenglobe' || kaizoCookies.paused) { return; }
			if (e.key == 'ArrowLeft') {
				decay.utenglobeTab--;
			} else if (e.key == 'ArrowRight') {
				decay.utenglobeTab++;
			} else { return; }
			let unlockedAmount = 0;
			for (let i in decay.allUtenglobeTabs) {
				if (!decay.allUtenglobeTabs[i].unlock || decay.allUtenglobeTabs[i].unlock()) {
					unlockedAmount++;
				}
			} 
			decay.utenglobeTab = (decay.utenglobeTab + unlockedAmount) % unlockedAmount;
			decay.updateUtenglobe();
		});
		AddEvent(document, 'keydown', function(e) {
			if (!Game.specialTabs.length || kaizoCookies.paused) { return; }
			if (!Game.specialTab && (e.key == 'ArrowUp' || e.key == 'ArrowDown')) { 
				Game.specialTab = Game.specialTabs[Game.specialTabs.length - 1]; 
				e.preventDefault(); 
				Game.ToggleSpecialMenu(1); 
				return; 
			}
			if (e.key == 'ArrowUp') {
				Game.specialTab = Game.specialTabs[(Game.specialTabs.indexOf(Game.specialTab) + 1) % Game.specialTabs.length];
				e.preventDefault();
				Game.ToggleSpecialMenu(1);
			} else if (e.key == 'ArrowDown') {
				Game.specialTab = Game.specialTabs[(Game.specialTabs.indexOf(Game.specialTab) - 1 + Game.specialTabs.length) % Game.specialTabs.length];
				e.preventDefault();
				Game.ToggleSpecialMenu(1);
			}
		});
		injectCSS('.tabSwitcher { bottom: 0; width: 100%; height: 24px; display: flex; flex-direction: row; }');
		injectCSS(`.tabButton { width: 100%; align-items: center; font-size: 14px; justify-content: center; font-family: 'Merriweather',Georgia,serif; font-weight:bold; padding: 3px; margin-left: 5px; margin-right: 5px; font-variant: small-caps; }`);
		injectCSS(`.tabButton.highlighted { border: 1px solid rgba(255,255,255,1); border-radius: 4px; background:linear-gradient(to right,rgba(255,255,255,0.5), transparent 25%, transparent 75%, rgba(255,255,255,0.5)); }`)
		injectCSS(`.tabButton:hover { text-shadow:0px -2px 4px rgba(255,255,200,0.4),0px 1px 0px rgba(100,100,100,1),0px 2px 4px rgba(0,0,0,1); }`);
		injectCSS(`.utenglobeMain { width: 100%; height: 100%; padding: 2px; text-align: center; }`);
		injectCSS(`.materialContainer { display:inline-block; margin-bottom: 4px; margin-top: 4px; margin-left: 10px; margin-right: 10px; }`);
		injectCSS(`.option.framed.large.materialButton { width: 48px; height: 48px; padding:0px; }`);
		injectCSS(`.option.framed.large.materialButton:hover { background:radial-gradient(circle at 50% 50%, transparent, transparent 65%, rgba(226, 255, 252, 1)); box-shadow: 0px 0px 6px 2px rgba(226, 255, 252, 0.4); }`);
		injectCSS(`.option.framed.large.materialButton:active { background:radial-gradient(circle at 50% 50%, transparent, rgba(226, 255, 252, 1), rgba(226, 255, 252, 1)); box-shadow: 0px 0px 8px 3px rgba(226, 255, 252, 0.8); }`);
		injectCSS(`.materialIcon { margin: auto; width: 48px; height: 48px; }`);
		injectCSS(`.materialCountText { font-size: 12px; margin-top: -2px; margin-bottom: 2px; font-family: 'Merriweather',Georgia,serif; text-shadow:0px 2px 4px rgba(255,255,200,0.4),0px 1px 0px rgba(100,100,100,1); }`);
		injectCSS(`.option.framed.utenglobeAutoClaimToggle { position: absolute; top: 32px; right: 12px; margin: 0px; padding: 3px; width: 16px; height: 16px; }`);
		injectCSS(`.option.framed.utenglobeShinyCondenser{ position: absolute; top: 32px; left: 12px; margin: 0px; padding: 3px; width: 16px; height: 16px; }`);
		injectCSS(`.option.framed.utenglobeShinyCondenser:hover { background: #4b4b40; }`);
		injectCSS(`.option.framed.utenglobeShinyCondenser:active { background: rgb(148, 116, 1); }`);
		injectCSS(`.option.framed.utenglobePowerchannelToggle { position: absolute; top: 72px; right: 12px; margin: 0px; padding: 3px; width: 16px; height: 16px; }`);
		injectCSS(`.option.framed.utenglobeUpgrade { cursor: pointer; font-size: 10px; padding: 8px; line-height: 135%; margin-right: 2px; margin-left: 2px; }`);
		injectCSS(`.option.framed.utenglobeUpgrade:hover { background: #4b4b40; }`);
		injectCSS(`.option.framed.utenglobeUpgrade:active { background:#e3dfd0; }`);
		injectCSS(`.block.incomplete { font-size: 10px; }`); 
		injectCSS(`.block.incomplete.soulColor { border-color: #b7fffb; box-shadow: 0px 0px 3px 0px #b7fffb; }`);
		injectCSS(`.block.incomplete.shinyColor { border-color: #e0c020; box-shadow: 0px 0px 3px 0px #e0c020; }`);
		injectCSS(`.block.capped { font-size: 10px; }`);
		injectCSS(`.fuseAmountText { width: 100%; margin-bottom: 2px; height: 8px; margin-top: 1px; font-size: 10px; }`);
		injectCSS(`.fuseAmountText.canDischarge { color: #fff; cursor: pointer; border: 1px dashed #ff1d87; border-radius: 2px; height: 20px; margin-bottom: -1px; line-height: 20px; background: radial-gradient(circle at 50% 50%, transparent, transparent 90%, #ff1d87); }`);
		injectCSS(`.fuseAmountText.canDischarge:hover { border: 1px solid #ff1d87; background: radial-gradient(circle at 50% 50%, transparent, transparent 65%, #ff1d87); }`);
		injectCSS(`.fuseAmountText.canDischarge:active { background: #ff1d87 }`);
		injectCSS(`.shatteredDecayText { font-weight: bold; font-size: 13px; }`);
		injectCSS(`.option.framed.utenglobeQuickRelease{ position: absolute; top: 72px; left: 12px; margin: 0px; padding: 3px; width: 16px; height: 16px; }`);
		injectCSS(`.option.framed.utenglobeQuickRelease:hover { background:rgb(72, 64, 75); }`);
		injectCSS(`.option.framed.utenglobeQuickRelease:active { background: rgb(84, 1, 148); }`);
		//injectCSS(`@keyframes ominousCycle { 0% {color:#ff1d87;} 50% {color:#ff5f2e;} 100% {color:#ff1d87;} }`); couldnt use this due to the thing being redrawn too much
		decay.utenglobeOpen = function() {
			if (Game.specialTab != 'utenglobe') { return ''; }
			let str = '<h3 style="pointer-events:none;">Utenglobe, Undead Preserver</h3>';
			str += '<div class="line"></div>';
			str += '<div class="utenglobeMain">';
			str += decay.allUtenglobeTabs[decay.utenglobeTab].details();

			str += '</div>';
			let tabSwitcher = '<div class="line"></div><div class="tabSwitcher">';
			for (let i in decay.allUtenglobeTabs) {
				if (decay.allUtenglobeTabs[i].unlock && !decay.allUtenglobeTabs[i].unlock()) { continue; }
				tabSwitcher += '<div class="tabButton'+(i==decay.utenglobeTab?' highlighted':'')+'" '+Game.clickStr+'="decay.utenglobeTab='+i+';Game.ToggleSpecialMenu(1);">'+decay.allUtenglobeTabs[i].text+'</div>';
			}
			tabSwitcher += '</div>';

			return str + tabSwitcher;
		}
		decay.updateUtenglobe = function() {
			if (Game.specialTab != 'utenglobe') { return; } else { Game.ToggleSpecialMenu(1); }
		}
 		decay.utenglobeStorageItem = function(key, name, cap, icon, withdrawFunc, desc, capFunc, upgradeButtons, gameCanKey) {
			this.key = key;
			this.name = name;
			this.cap = cap;
			this.icon = icon;
			this.amount = 0;
			this.withdrawFunc = withdrawFunc;
			this.desc = desc;
			this.capFunc = capFunc;
			this.upgradeButtons = upgradeButtons;
			this.gameCanKey = gameCanKey;
			this.unlocked = false;
		}
		addLoc('You can deposit this material by dragging an instance into the milk, and take out stored material by clicking on the button.');
		decay.utenglobeStorageItem.prototype.getButton = function(margins) {
			this.setCap();
			if (!this.unlocked) { return ''; }
			return '<div class="materialContainer" '+Game.getTooltip('<div style="min-width:300px;text-align:center;font-size:11px;padding-top:4px;padding-bottom:4px;"><h3><b>' + this.name + '</b></h3><div class="line"></div>' + loc('You can deposit this material by dragging an instance into the milk, and take out stored material by clicking on the button.') + '<br><small>' + loc(this.desc) + '</small></div>', 'top', true)+' style="margin-left:'+margins+'px;margin-right:'+margins+'px"><div class="option framed large materialButton" '+Game.clickStr+'="decay.utenglobeStorage[\''+this.key+'\'].withdraw(Game.keys[16] && Game.keys[17]);Game.ToggleSpecialMenu(1);"><div class="materialIcon" style="'+writeIcon(this.icon)+'"></div></div><div class="materialCountText">'+Beautify(this.amount)+' / '+Beautify(this.cap)+'</div></div>';
		}
		decay.utenglobeStorageItem.prototype.withdraw = function(all) {
			if (!decay.gameCan[this.gameCanKey]) { return; }
			if (all) {
				for (let i = 0; i < this.amount; i++) {
					this.withdrawFunc();
				}
				this.amount = 0;
			} else {
				if (this.amount <= 0) { return; }
				this.amount--;
				this.withdrawFunc();
			}
		}
		decay.utenglobeStorageItem.prototype.setCap = function() {
			this.cap = this.capFunc();
		}
		decay.utenglobeStorageItem.prototype.deposit = function(amount) {
			this.setCap();
			this.amount = Math.min(this.amount + amount, this.cap);
			decay.updateUtenglobe();
		}
		decay.utenglobeStorageItem.prototype.canDeposit = function() {
			if (!decay.utenglobeUnlocked) { return false; }
			this.setCap();
			return this.amount < this.cap;
		}
		decay.utenglobeStorageItem.prototype.lose = function(amount) {
			this.amount = Math.max(0, this.amount - amount);
			decay.updateUtenglobe();
		}
		decay.utenglobeStorageItem.prototype.getUpgradeDesc = function() {
			if (!this.unlocked) { return ''; }
			return '<div style="height: 100%; display: flex; justify-content: center; align-items: center; flex: 1;"><div style="display: inline-block; width: 10%;"><div style="width: 48px; height: 48px; transform: scale(0.5) translateX(-33%);'+writeIcon(this.icon)+'"></div></div><div style="display: inline-block; width: 80%; left: 0px;">'+this.upgradeButtons()+'</div><div style="display: inline-block; width: 10%;"><div style="width: 48px; height: 48px; transform: scale(0.5) translateX(-33%);'+writeIcon(this.icon)+'"></div></div></div>';
		}
		decay.utenglobeStorageItem.prototype.save = function() {
			return this.amount;
		}
		decay.utenglobeStorageItem.prototype.load = function(str) {
			if (isv(str)) { this.amount = parseFloat(str); }
		}
		addLoc('Revealed upon the death of wrinklers.');
		addLoc('Offer <b>%1</b> to raise maximum storage by <b>%2</b> (Currently: <b>+%3</b>)');
		addLoc('Offer cookies to raise maximum storage (Maxed out: <b>+%1</b>)');
		addLoc('Unlock another <b>%1</b> achievements to raise maximum storage by another <b>%2</b> (Currently: <b>+%3</b>)');
		addLoc('Unlock achievements to raise maximum storage (Maxed out: <b>+%1</b>)');
		addLoc('Revealed upon the death of an especially shiny variant of wrinklers. Quite hard to come by, as the shiny wrinklers are known for being tough.');
		addLoc('Complete <b>%1</b> more unshackled decay challenges to raise maximum storage by <b>%2</b> (Currently: <b>+%3</b>)');
		addLoc('Complete unshackled decay challenges to raise maximum storage (Maxed out: <b>+%1</b>)');
		addLoc('Offer <b>%1</b> to unlock the shiny condenser, converting normal souls to a shiny soul');
		addLoc('Offer <b>%1</b> to make shiny condensation more efficient');
		addLoc('Shiny condenser complete');
		addLoc('Energy embedded in the near-invisible and invincible phantom wrinklers, they seem to have the power to dispel the unholy.');
		addLoc('Offer <b>%1</b> to unlock quick release, fixing essences to your mouse');
		addLoc('Quick release button unlocked');
		decay.utenglobeSoulCookieUpgradeCount = 0;
		decay.ugSoulCookieUpgradeCostMap = [1e9, 1e10, 1e11, 1e12, 1e14, 1e17, 1e21, 1e26, 1e32, 1e39, 1e47, 1e56];
		decay.tryBuyUtenglobeCookieUpgrade = function() {
			if (decay.utenglobeSoulCookieUpgradeCount >= decay.ugSoulCookieUpgradeCostMap.length || Game.cookies < decay.ugSoulCookieUpgradeCostMap[decay.utenglobeSoulCookieUpgradeCount] || !decay.gameCan.upgradeUtenglobe) { return; }
			Game.Spend(decay.ugSoulCookieUpgradeCostMap[decay.utenglobeSoulCookieUpgradeCount]);
			decay.utenglobeSoulCookieUpgradeCount++;
			decay.updateUtenglobe();
		}
		decay.shinyCondenserUpgrades = 0;
		decay.shinyConvert = function(fromSoulAmount, toShinyAmount) {
			if (decay.utenglobeStorage.soul.amount < fromSoulAmount || !decay.gameCan.condenseSouls) { return; }
			decay.utenglobeStorage.soul.lose(fromSoulAmount);
			for (let i = 0; i < toShinyAmount; i++) {
				if (decay.utenglobeStorage.shinySoul.amount >= decay.utenglobeStorage.shinySoul.cap) {
					const h = decay.spawnWrinklerSoul(Crumbs.getCanvasByScope('left').canvas.parentNode.offsetWidth / 2, Crumbs.getCanvasByScope('left').canvas.parentNode.offsetHeight * 0.9, 1, (0.15 + Math.random() * 0.05) * (decay.utenglobeAutoClaim?2:1), (Math.random() * 5 - 2.5) * (decay.utenglobeAutoClaim?2:1)); 
					h.cookieAttract = decay.utenglobeAutoClaim;
				} else {
					decay.utenglobeStorage.shinySoul.deposit(1);
				}
			}
		}
		decay.quickReleaseUnlocked = false;
		decay.quickRelease = function() {
			if (decay.utenglobeStorage.phantomEssence.amount < 1) { return; }
			const h = Crumbs.spawn(decay.phantomEssenceTemplate, {
				grabbed: true
			});
			decay.utenglobeStorage.phantomEssence.lose(1);
		}
		decay.utenglobeStorage = {
			soul: new decay.utenglobeStorageItem('soul', 'Wrinkler soul', 6, [9, 3, kaizoCookies.images.custImg], function() { 
				if (decay.utenglobePowerchanneling) { 
					decay.gainPower(10 * (decay.isConditional('powerClickWrinklers')?4.5:1) * decay.utenglobePowerchannelEff * (0.75 + Math.random() * 0.5), Crumbs.scopedCanvas.left.width * 0.5, Crumbs.scopedCanvas.left.height * 0.4, 0, 0, 250 + 400 * decay.soulClaimPowerFragMagnitudeMultiplier); 
					decay.soulClaimPowerFragMagnitudeMultiplier += 0.3;
					decay.times.sinceSoulClaim = 0;
					Crumbs.spawn(decay.shockwaveTemplate, {
						delay: 0 * Game.fps,
						speed: (1 + 1.5 * decay.soulClaimPowerFragMagnitudeMultiplier) / Game.fps,
						speedDecMult: 0.05,
						alphaDecreaseRate: 0.75 / Game.fps,
						x: Crumbs.scopedCanvas.left.l.width * 0.5,
						y: Crumbs.scopedCanvas.left.l.height * 0.4,
						isFromPC: false,
						trigger: false,
						rotation: Math.random() * Math.PI,
						imgUsing: Math.round(Math.random())
					});
					return; 
				}
				const h = decay.spawnWrinklerSoul(Crumbs.scopedCanvas.left.l.width / 2, Crumbs.scopedCanvas.left.l.height * 0.9, 0, (0.15 + Math.random() * 0.05) * (decay.utenglobeAutoClaim?2:1), (Math.random() * 5 - 2.5) * (decay.utenglobeAutoClaim?2.5:1)); 
				h.cookieAttract = decay.utenglobeAutoClaim;
			}, loc('Revealed upon the death of wrinklers.'), function() {
				return 6 + decay.utenglobeSoulCookieUpgradeCount * 2 + Math.min(Math.floor((Game.AchievementsOwned + 60) / 130), 5) * 2;
			}, function() { 
				const firstButton = '<div class="option framed utenglobeUpgrade" '+Game.clickStr+'="decay.tryBuyUtenglobeCookieUpgrade();">' + loc('Offer <b>%1</b> to raise maximum storage by <b>%2</b> (Currently: <b>+%3</b>)', [loc('%1 cookie', Beautify(decay.ugSoulCookieUpgradeCostMap[decay.utenglobeSoulCookieUpgradeCount])), 2, Beautify(decay.utenglobeSoulCookieUpgradeCount * 2)]) + '</div>';
				const firstButtonCapped = '<div class="block capped">' + loc('Offer cookies to raise maximum storage (Maxed out: <b>+%1</b>)', Beautify(decay.utenglobeSoulCookieUpgradeCount * 2)) + '</div>';
				const secondButton = '<div class="block incomplete soulColor">' + loc('Unlock another <b>%1</b> achievements to raise maximum storage by another <b>%2</b> (Currently: <b>+%3</b>)', [Beautify((Math.floor((Game.AchievementsOwned + 60) / 130) + 1) * 130 - 60 - Game.AchievementsOwned), 2, Beautify(Math.min(Math.floor((Game.AchievementsOwned + 60) / 130), 5) * 2)]) + '</div>';
				const secondButtonCapped = '<div class="block capped">' + loc('Unlock achievements to raise maximum storage (Maxed out: <b>+%1</b>)', Beautify(10)) + '</div>';

				return (decay.utenglobeSoulCookieUpgradeCount<12?firstButton:firstButtonCapped) + (Game.AchievementsOwned<590?secondButton:secondButtonCapped);
			}, 'releaseSouls'),
			shinySoul: new decay.utenglobeStorageItem('shinySoul', 'Shiny wrinkler soul', 4, [10, 3, kaizoCookies.images.custImg], function() { 
				if (decay.utenglobePowerchanneling) { 
					decay.gainPower(30 * (decay.isConditional('powerClickWrinklers')?4.5:1) * decay.utenglobePowerchannelEff * (0.75 + Math.random() * 0.5), Crumbs.scopedCanvas.left.width * 0.5, Crumbs.scopedCanvas.left.height * 0.4, 0, 0, 300 + 500 * decay.soulClaimPowerFragMagnitudeMultiplier); 
					decay.soulClaimPowerFragMagnitudeMultiplier += 0.5;
					decay.times.sinceSoulClaim = 0;
					Crumbs.spawn(decay.shockwaveTemplate, {
						delay: 0 * Game.fps,
						speed: (2 + 1.5 * decay.soulClaimPowerFragMagnitudeMultiplier) / Game.fps,
						speedDecMult: 0.06,
						alphaDecreaseRate: 0.7 / Game.fps,
						x: Crumbs.scopedCanvas.left.l.width * 0.5,
						y: Crumbs.scopedCanvas.left.l.height * 0.4,
						isFromPC: false,
						trigger: false,
						rotation: Math.random() * Math.PI,
						imgUsing: Math.round(Math.random())
					});
					return; 
				}
				const h = decay.spawnWrinklerSoul(Crumbs.scopedCanvas.left.l.width / 2, Crumbs.scopedCanvas.left.l.height * 0.9, 1, (0.15 + Math.random() * 0.05) * (decay.utenglobeAutoClaim?2:1), (Math.random() * 5 - 2.5) * (decay.utenglobeAutoClaim?2:1)); 
				h.cookieAttract = decay.utenglobeAutoClaim;
			}, loc('Revealed upon the death of an especially shiny variant of wrinklers. Quite hard to come by, as the shiny wrinklers are known for being tough.'), function() {
				return 4 + Math.min(Math.floor(Math.log2(decay.challengesCompleted + 1)), 4);
			}, function() {
				const button = ('<div class="option framed utenglobeUpgrade" '+Game.clickStr+'="if (Game.cookies > 2e10 && decay.gameCan.upgradeUtenglobe) { Game.Spend(2e10); decay.shinyCondenserUnlocked = true; decay.updateUtenglobe(); }">' + loc('Offer <b>%1</b> to unlock the shiny condenser, converting normal souls to a shiny soul', loc('%1 cookie', Beautify(2e10))) + '</div>');
				const buttonAlt = ('<div class="option framed utenglobeUpgrade" '+Game.clickStr+'="if (Game.cookies > 2e18 && decay.gameCan.upgradeUtenglobe) { Game.Spend(2e18); decay.shinyCondenserUpgrades++; decay.updateUtenglobe(); }">' + loc('Offer <b>%1</b> to make shiny condensation more efficient', loc('%1 cookie', Beautify(2e18))) + '</div>');
				const buttonCapped = '<div class="block capped">' + loc('Shiny condenser complete') + '</div>';
				const prompt = '<div class="block incomplete shinyColor">' + loc('Complete <b>%1</b> more unshackled decay challenges to raise maximum storage by <b>%2</b> (Currently: <b>+%3</b>)', [Beautify(Math.pow(2, Math.floor(Math.log2(decay.challengesCompleted + 1)) + 1) - 1 - decay.challengesCompleted), 1, Math.floor(Math.log2(decay.challengesCompleted + 1))]) + '</div>';
				const promptCapped = '<div class="block capped">' + loc('Complete unshackled decay challenges to raise maximum storage (Maxed out: <b>+%1</b>)', Beautify(4)) + '</div>';
				return (decay.shinyCondenserUnlocked?(decay.shinyCondenserUpgrades?buttonCapped:buttonAlt):button) + (decay.challengesCompleted<31?prompt:promptCapped);
			}, 'releaseShinySouls'),
			phantomEssence: new decay.utenglobeStorageItem('phantomEssence', 'Phantom essence', 8, [26, 16, kaizoCookies.images.custImg], function() {
				const h = Crumbs.spawn(decay.phantomEssenceTemplate, {
					x: Crumbs.scopedCanvas.left.l.width / 2, 
					y: Crumbs.scopedCanvas.left.l.height * 0.9,
					xd: -80 + Math.random() * 160,
					yd: -Crumbs.scopedCanvas.left.l.height * (1 + Math.random() * 0.25)
				});
			}, loc('Energy embedded in the near-invisible and invincible phantom wrinklers, they seem to have the power to dispel the unholy.'), function() {
				return 8;
			}, function() {
				const button = ('<div class="option framed utenglobeUpgrade" '+Game.clickStr+'="if (Game.cookies > 1e40 && decay.gameCan.upgradeUtenglobe) { Game.Spend(1e40); decay.quickReleaseUnlocked = true; decay.updateUtenglobe(); }">' + loc('Offer <b>%1</b> to unlock quick release, fixing essences to your mouse', loc('%1 cookie', Beautify(1e40))) + '</div>');
				const buttonCapped = '<div class="block capped">' + loc('Quick release button unlocked') + '</div>';
				return decay.quickReleaseUnlocked?buttonCapped:button;
			}, 'releasePhantomEssences')
		}
		decay.utenglobeStorage.soul.unlocked = true;
		decay.utenglobeStorage.shinySoul.unlocked = true;

		decay.greatSouls = [];
		decay.greatSoulStorageLimit = 2;
		decay.greatSoulTypes = {};
		decay.greatSoulType = function(key, name, desc, costObj, onClaim) {
			this.key = key;
			this.name = name;
			addLoc(desc);
			this.desc = loc(desc);
			this.cost = costObj;
			this.onClaim = onClaim;

			decay.greatSoulTypes[key] = this;
		}
		decay.greatSoulType.prototype.getButton = function() {
			return '';
		}
		decay.greatSoulType.prototype.canCreate = function() {
			for (let i in this.cost) {
				if (decay.utenglobeStorage[i].amount < this.cost[i]) { return false; }
			}
			return true;
		}
		decay.greatSoulType.prototype.create = function() {
			if (!this.canCreate()) { return; }
			if (decay.greatSouls.length < decay.greatSoulStorageLimit) { decay.greatSouls.push(this.key); }
			for (let i in this.cost) {
				decay.utenglobeStorage[i].amount = Math.max(decay.utenglobeStorage[i].amount - this.cost[i], 0);
			}
			decay.updateUtenglobe();
		}
		decay.greatSoulType.prototype.claim = function() {
			if (!decay.greatSouls.includes(this.key)) { return; }
			this.onClaim();
			decay.greatSouls.splice(decay.greatSouls.indexOf(this.key), 1);
			decay.updateUtenglobe();
		}
		new decay.greatSoulType('normal', 'Crystallizing Great soul', {
			soul: 8
		}, function() {
			//inward auras that squeeze the big cookie to decrease momentum, happens more than once
		});
		new decay.greatSoulType('shiny', 'Radiant Great soul', {
			soul: 2,
			shinySoul: 2
		});

		decay.saveUtenglobe = function() {
			let str = '';
			for (let i in decay.utenglobeStorage) {
				str += decay.utenglobeStorage[i].save();
				str += '-';
			}
			str = str.slice(0, str.length - 1) + ',';
			str += decay.utenglobeSoulCookieUpgradeCount + ',';
			str += (Game.specialTab=='utenglobe'?1:0) + ',';
			str += (decay.utenglobeAutoClaim?1:0) + ',';
			str += (decay.shinyCondenserUnlocked?1:0) + ',';
			str += decay.shinyCondenserUpgrades + ',';
			str += (decay.utenglobePowerchanneling?1:0) + ',';
			str += (decay.quickReleaseUnlocked?1:0)
			return str;
		}
		decay.loadUtenglobe = function(str) {
			str = str.split(',');
			let str2 = str[0].split('-');
			let count = 0;
			for (let i in decay.utenglobeStorage) {
				decay.utenglobeStorage[i].load(str2[count]);
				count++;
			}
			if (isv(str[1])) { decay.utenglobeSoulCookieUpgradeCount = parseFloat(str[1]); }
			if (isv(str[3])) { decay.utenglobeAutoClaim = Boolean(parseFloat(str[3])); } //moved before to allow the autoclaim indication to appear instantly
			if (isv(str[2]) && parseInt(str[2])) { Game.specialTab = 'utenglobe'; Game.ToggleSpecialMenu(1); }
			if (isv(str[4])) { decay.shinyCondenserUnlocked = Boolean(parseFloat(str[4])); }
			if (isv(str[5])) { decay.shinyCondenserUpgrades = parseFloat(str[5]); } 
			if (isv(str[6])) { decay.utenglobePowerchanneling = Boolean(parseFloat(str[6])); }
			if (isv(str[7])) { decay.quickReleaseUnlocked = Boolean(parseFloat(str[7])); }
		}
		eval('Game.LoadSave='+Game.LoadSave.toString().replace('Game.specialTab=\'\';', '').replace('Game.ToggleSpecialMenu(0);', '').replace('Game.loadModData();', 'Game.specialTab=\'\'; Game.ToggleSpecialMenu(0); Game.loadModData();'))
		decay.ascendUtenglobe = function() {
			decay.utenglobeSoulCookieUpgradeCount = 0;
			for (let i in decay.utenglobeStorage) {
				decay.utenglobeStorage[i].amount = 0;
				decay.utenglobeStorage[i].setCap();
			}
			decay.shinyCondenserUnlocked = false;
			decay.shinyCondenserUpgrades = 0;
			decay.quickReleaseUnlocked = false;
			if (decay.challengeStatus('powerClickWrinklers')) { decay.utenglobeStorage.soul.deposit(10000); }
		}
		decay.wipeUtenglobe = function() {
			decay.ascendUtenglobe();

			decay.utenglobeUnlocked = false;
			decay.utenglobeSoulCookieUpgradeCount = 0;
			decay.utenglobeAutoClaim = true;
			for (let i in decay.utenglobeStorage) {
				decay.utenglobeStorage[i].amount = 0;
				decay.utenglobeStorage[i].setCap();
			}
			decay.shinyCondenserUnlocked = false;
			decay.shinyCondenserUpgrades = 0;
		}

		new Game.Upgrade('Touch of force [ACTIVE]', 'Click a wrinkler to <b>destroy a layer</b> and <b>knock it back</b>!', 0, [13, 0, kaizoCookies.images.custImg]); 
		decay.touchOfForceCooldown = 0;
		decay.touchOfForceCooldownInit = 90 * Game.fps;
		Game.last.pool = 'toggle'; Game.last.toggleInto = 'Touch of force'; Game.UpgradesByPool.toggle.push(Game.last); 
		Game.last.buyFunction = function() { 
			Game.Lock('Touch of force');
			Game.Unlock('Touch of force');
			Game.upgradesToRebuild = 1; 
		}
		Game.last.order = 16000;
		Game.last.bought = 1;
		new Game.Upgrade('Touch of force', 'Enable to <b>empower</b> the next click against wrinklers! <br>(Shortcut: <b>Ctrl + D</b>)<q>The force calls out to you...</q>', 0, [14, 0, kaizoCookies.images.custImg]);
		Game.last.pool = 'toggle'; Game.last.toggleInto = 'Touch of force [ACTIVE]'; Game.UpgradesByPool.toggle.push(Game.last);
		Game.last.buyFunction = function() {
			if (decay.touchOfForceCooldown) { return; }
			//Game.Upgrades['Touch of force [ACTIVE]'].bought = 0;
			Game.Lock('Touch of force');
			Game.upgradesToRebuild = 1;
		} 
		addLoc('Recharges in: <b>%1</b>');
		Game.last.displayFuncWhenOwned = function() { return '<div style="text-align: center;">'+loc('Recharges in: <b>%1</b>', Game.sayTime(decay.touchOfForceCooldown, -1))+'</div>'; }
		Game.last.timerDisplay = function() { if (!decay.touchOfForceCooldown) { return -1; } return 1 - decay.touchOfForceCooldown / decay.touchOfForceCooldownInit; }
		Game.last.order = 16001;
		AddEvent(document, 'keydown', function(e) { 
			if (e.ctrlKey && e.key.toLowerCase() == 'd') { 
				if (Game.HasUnlocked('Touch of force') && !Game.Has('Touch of force')) { Game.Upgrades['Touch of force'].buy(); }
				else if (Game.HasUnlocked('Touch of force [ACTIVE]') && !Game.Has('Touch of force [ACTIVE]')) { Game.Upgrades['Touch of force [ACTIVE]'].buy(); }
				e.preventDefault();
			}
		});
		decay.updateTouchOfForce = function() {
			if (decay.touchOfForceCooldown) {
				decay.touchOfForceCooldown--;
				if (decay.touchOfForceCooldown == 0) {
					Game.Lock('Touch of force');
					Game.Unlock('Touch of force');
					Game.Notify('Touch of force recharged!', '', 0);
				}
			}
		}
		decay.performTouchOfForce = function(w) {
			if (Game.Has('Touch of force [ACTIVE]') || !decay.challengeStatus('pledge')) { return false; }
			Game.Upgrades['Touch of force [ACTIVE]'].bought = 1;
			decay.touchOfForceCooldown = decay.touchOfForceCooldownInit;
			Game.Unlock('Touch of force');
			Game.Upgrades['Touch of force'].bought = 1;
			w.dist += 0.8;
			decay.damageWrinkler.call(w, 100000, false, true);
			w.hurt += 200 * decay.wrinklerResistance;
			decay.spawnWrinklerbits(w, 8, 2, 4, decay.wrinklerExplosionBitsFunc);
		}
		Game.registerHook('check', function() { if (decay.challengeStatus('pledge')) { Game.Unlock('Touch of force [ACTIVE]'); if (Game.Has('Touch of force [ACTIVE]')) { Game.Unlock('Touch of force'); } } });
		decay.saveTouchOfForce = function() {
			let str = decay.touchOfForceCooldown + ',';
			if (Game.HasUnlocked('Touch of force') && !Game.Has('Touch of force')) { str += 'OFF'; }
			else if (Game.HasUnlocked('Touch of force [ACTIVE]') && !Game.Has('Touch of force [ACTIVE]')) { str += 'ON'; }
			else if (decay.touchOfForceCooldown) { str += 'CD'; }
			else { str += 'NA'; }
			return str;
		}
		decay.loadTouchOfForce = function(str) {
			Game.Lock('Touch of force');
			Game.Lock('Touch of force [ACTIVE]');
			Game.Upgrades['Touch of force [ACTIVE]'].bought = 1;
			if (decay.challengeStatus('pledge')) { Game.Unlock('Touch of force [ACTIVE]'); if (Game.Has('Touch of force [ACTIVE]')) { Game.Unlock('Touch of force'); } }
			else { return; }
			str = str.split(',');
			if (isv(str[0])) { decay.touchOfForceCooldown = parseFloat(str[0]); }
			if (str[1] == 'ON') {
				Game.Upgrades['Touch of force'].buy();
			} else if (str[1] == 'CD') {
				Game.Upgrades['Touch of force'].bought = 1;
			}
		}
		
		decay.getBuffLoss = function(name) {
			if (decay.exemptBuffs.includes(name)) { return 1; }
			if (Game.auraMult('Epoch Manipulator') && decay.gen > 1) {
				return 1 - Math.min(Game.auraMult('Epoch Manipulator'), 1) * 0.5 * (1 - 1 / Math.pow(decay.gen, Math.max(Game.auraMult('Epoch Manipulator'), 1)));
			} 
			return 1;
		}
		eval('Game.updateBuffs='+Game.updateBuffs.toString().replaceAll('buff.time--;','buff.time -= decay.getBuffLoss(buff.type.name); buff.time++; buff.time--;'));

		//have to put this outside otherwise it doesnt work (??????????)
		decay.cpsPurityMults = function() {
			//all the upgrades that do "+X% Cps for every x2 CpS multiplier from your purity"
			if (decay.gen <= 1) { decay.extraPurityCps = 1; decay.hasExtraPurityCps = false; return 1; }

			const purityLog = Math.log2(decay.gen);
			const l5 = Math.pow(1.05, purityLog);
			const l10 = Math.pow(1.1, purityLog);
			const l15 = Math.pow(1.15, purityLog);
			var total = 1;
			if (Game.Has('Market manipulator')) { total *= l5; }
			if (decay.challengeStatus('combo3')) { total *= Math.pow(2, purityLog); }
			total *= Math.pow(1 + decay.challengeStatus('bakeR') * 0.05, purityLog);
			total *= Math.pow(1 + decay.challengeStatus('typingR') * 0.05, purityLog);
			total *= Math.pow(1 + decay.challengeStatus('allBuffStackR') * 0.05, purityLog);

			decay.extraPurityCps = total;
			if (total > 1) { decay.hasExtraPurityCps = true; } else { decay.hasExtraPurityCps = false; }
			return total;
		}

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('Game.globalCpsMult=mult;', 'Game.globalCpsMult*=mult;').replace(`if (Game.Has('Occult obstruction')) mult*=0;`, `if (Game.Has('Occult obstruction')) { mult*=0; } Game.globalCpsMult = 1;`));

		allValues('decay effects');

		/*=====================================================================================
        Sugar lumps
        =======================================================================================*/

		addLoc('Wrinklers may occasionally carry <b>sugar lumps</b>, which greatly increases their <b>durability</b>.');
		addLoc('Sugar lump-carrying wrinklers <b>shares the damage</b> other wrinklers take with damage reduction, and removing a layer of a lump-carrying wrinkler <b>speeds up all wrinklers</b> for a short amount of time.');
		addLoc('Sugar lumps are delicious and may be used as currency for all sorts of things.');
		Game.lumpTooltip = function() {
			var str='<div style="padding:8px;width:400px;font-size:11px;text-align:center;" id="tooltipLumps">'+
			loc("You have %1.",'<span class="price lump">'+loc("%1 sugar lump",LBeautify(Game.lumps))+'</span>')+
			'<div class="line"></div>'+

			loc('Wrinklers may occasionally carry <b>sugar lumps</b>, which greatly increases their <b>durability</b>.')+'<br>'+
			loc('Sugar lump-carrying wrinklers <b>shares the damage</b> other wrinklers take with damage reduction, and removing a layer of a lump-carrying wrinkler <b>speeds up all wrinklers</b> for a short amount of time.')+
			'<div class="line"></div>'+

			loc('Sugar lumps are delicious and may be used as currency for all sorts of things.');

			return str + '</div>';
		}
		addLoc(`Because you've baked a <b>billion cookies</b> in total, you are now attracting <b>sugar lumps</b>. Wrinklers now have a chance to carry them, and they may be spent on a variety of useful upgrades and things, such as upgrading the existing 4 minigames! (All minigames are already unlocked)`);
		Game.doLumps = function() {
			if (Game.lumpRefill>0) Game.lumpRefill--;
			
			if (!Game.canLumps()) {Game.removeClass('lumpsOn');return;}
			if (Game.lumpsTotal==-1)
			{
				//first time !
				if (Game.ascensionMode!=1) Game.addClass('lumpsOn');
				Game.lumpT=Date.now();
				Game.lumpsTotal=0;
				Game.lumps=0;
				Game.computeLumpType();
				
				Game.Notify(loc("Sugar lumps!"),loc("Because you've baked a <b>billion cookies</b> in total, you are now attracting <b>sugar lumps</b>. Wrinklers now have a chance to carry them, and they may be spent on a variety of useful upgrades and things, such as upgrading the existing 4 minigames! (All minigames are already unlocked)"),[23,14]);
			}

			l('lumpsAmount').textContent=Beautify(Game.lumps);
		}
		l('lumpsIcon').style.backgroundPosition=(-29*48)+'px '+(-14*48)+'px';
		l('lumpsIcon2').style.backgroundPosition=(-29*48)+'px '+(-14*48)+'px';
		l('lumpsIcon2').style.opacity=1;
		//eval('Game.canLumps='+Game.canLumps.toString().replace('1000000000', '1000000000000000'));
		decay.getRandomLumpType = function() {
			//2 bifur, 3 golden, 4 meaty, 5 caramel
			let pool = [1];
			let hasCaramel = false;
			let allWrinklers = Crumbs.getObjects('w');
			for (let i in allWrinklers) {
				if (allWrinklers[i].lumpCarrying == 5) { hasCaramel = true; break; }
			}
			let allLumps = Crumbs.getObjects('lump');
			for (let i in allLumps) {
				if (allLumps[i].type == 5) { hasCaramel = true; break; }
			}
			let loops = 1 + 0.25 * Game.Has('Stevia Caelestis');
			for (let i = 0; i < randomFloor(loops); i++) {
				if (Math.random() < 0.2) { pool.push(2); }
				if (Math.random() < 0.01) { pool.push(3); }
				if (Math.random() < ((!this.shiny)?0.3:0.1) * (Game.Has('Sugar aging process')?(1 + Math.min(Game.Objects.Grandma.amount, 666) * 0.0006):1)) { pool.push(4); }
				if (Math.random() < 0.05 && !hasCaramel && decay.times.sinceLastCaramelClaim > 15 * 60 * Game.fps) { pool.push(5); }
			}
			return choose(pool);
		}
		addLoc('Minigame refills triggered!');
		addLoc('Triggered a garden tick with forced mutations, maxed out worship swaps, and filled 100 magic.');
		decay.halts['lumpClaim'] = new decay.haltChannel({
			properName: loc('Meaty disgust'),
			keep: 5,
			decMult: 5,
			overtimeLimit: 1000,
			overtimeEfficiency: 0.5
		});
		decay.claimLump = function(lump) {
			let toGain = 0;
			switch (lump.type) {
				case 1: 
					toGain = 1; 
					break;
				case 2: 
					toGain = randomFloor(1.5 + 0.25 * Game.Has('Sucralosia Inutilis')); 
					Game.Win('Sugar sugar'); 
					break;
				case 3: 
					toGain = Math.floor(2 + Math.random() * 5); 
					Game.gainBuff('sugar blessing',24*60*60,1); 
					Game.Earn(Math.min(Game.cookiesPs*60*60*24,Game.cookies)); 
					Game.Notify(loc("Sugar blessing activated!"),loc("Your cookies have been doubled.<br>+10% golden cookies for the next 24 hours."),[29,16]); 
					Game.Win('All-natural cane sugar'); 
					break;
				case 4: 
					toGain = randomFloor(choose([0, 0, 1, 2, 2]) * (Game.Has('Sugar aging process')?(1 + Math.min(Game.Objects.Grandma.amount, 666) * 0.0006):1)); 
					Game.Win('Sweetmeats'); 
					break;
				case 5: 
					toGain = choose([1, 2, 3]); 
					Game.lumpRefill = 0;
					gp.lumpRefill.click();
					Game.lumpRefill = 0;
					gap.lumpRefill.click();
					Game.lumpRefill = 0;
					pp.lumpRefill.click();
					Game.gainLumps(3);
					Game.Notify(loc('Minigame refills triggered!'), loc('Triggered a garden tick with forced mutations, maxed out worship swaps, and filled 100 magic.'), [29, 27]);
					decay.times.sinceLastCaramelClaim = 0;
					Game.Win('Maillard reaction'); 
					break;
			}
			if (toGain == 0) {
				Game.Popup(loc('Botched harvest!'), lump.x, lump.y);
				return;
			}
			Game.gainLumps(toGain);
			if (Game.Has('Meaty disgust')) { 
				decay.stop(15 * (lump.type == 4?3:1), 'lumpClaim');
			}
			Game.Popup(loc('+%1 sugar lump!', LBeautify(toGain)) + (Game.Has('Meaty disgust')?('<br><small>' + loc('Decay halted!') + '</small>'):''), lump.x, lump.y);
		}

		decay.getUpgradeTooltipCSS = function(name) {
			return Game.getDynamicTooltip('(function(){return Game.crateTooltip(Game.Upgrades[\''+name+'\']);})','',true);
		}
		injectCSS(`.highlightHover.underlined { text-decoration: underline; color: #ddd; cursor: pointer; }`);
		injectCSS(`.highlightHover.underlined:hover { text-decoration: underline; color: #fff; }`);

		new Game.Upgrade('Glucose furnace', 'Click to open the furnace!', 0, [25, 3, kaizoCookies.images.custImg]); Game.last.pool = 'toggle'; Game.last.order = 22000;
		addLoc('Will be ready in <b>%1</b>!');
		addLoc('Current boost: <b><span id=\"furnaceBoostDisplay\">+%1%</span> CpS</b>');
		addLoc('Current boost: <b>+%1</b> CpS');
		Game.last.descFunc = function() {
			if (this.bought) { return this.ddesc; }
			return '<div style="text-align: center;">' + (loc('Current boost: <b>+%1</b> CpS', Beautify(decay.furnaceBoost * 100 - 100, 1) + '%')) + '</div><div class="line"></div>' + this.ddesc;
		}
		Game.last.displayFuncWhenOwned = function() {
			return '<div style="text-align: center;">' + (loc('Will be ready in <b>%1</b>!', Game.sayTime(decay.furnaceReadyTime - Game.TCount, -1))) + '</div>';
		}
		Game.last.timerDisplay = function() {
			if (Game.TCount >= decay.furnaceReadyTime) { return -1; }
			return Game.TCount / decay.furnaceReadyTime;
		}
		addLoc('Use %1 to burn and increase CpS by <b>%2 per minute</b> over <b>%3</b>, for up to <b>%4</b>'); addLoc('Burn sugar lump');
		addLoc('Sacrifice your garden (by getting every seed) to increase cap by <b>%1</b> (additive) and add <b>+%2</b> per minute!');
		addLoc('Capped'); addLoc('Burn!'); addLoc('Burning<br> <b><span id="burnTimer">%1</span></b> remaining');
		addLoc('<b>+%1% --> +%2%</b> per minute'); addLoc('<b>%1% --> %2%</b> boost cap'); addLoc('MAXED');
		addLoc('Upgrade furnace speed'); addLoc('Upgrade furnace boost cap')
		addLoc('The below upgrades are kept through ascensions.'); addLoc('Level %1');
		addLoc('Auto-first burn');
		injectCSS('.sugarFurnaceChargeMain { text-align: center; line-height: 120%; }');
		injectCSS(`
			@keyframes lumpBurntCycle{
			0% {color:rgb(70, 32, 3);}
			50% {color:rgb(36, 18, 1);}
			100% {color:rgb(70, 32, 3);}
		}		
		`);
		injectCSS('.burnButton { cursor: pointer; margin:8px;padding:6px 12px; width:auto;text-align:center; }');
		injectCSS('.burnButton.standby { animation:lumpBurntCycle 5s infinite ease-in-out,pucker 0.2s ease-out;box-shadow:0px 0px 0px 1px #000,0px 0px 1px 2px currentcolor;background:linear-gradient(to bottom,rgba(201, 220, 221, 0.9) 0%,currentColor 300%); }')
		injectCSS('.burnButton.standby:hover { animation: pucker 0.2s ease-out; color: rgba(201, 220, 221); background:linear-gradient(to bottom,rgb(70, 32, 3) 0%,currentColor 300%); }');
		injectCSS('.burnButton.standby:active { animation: pucker 0.2s ease-out; color: #fff; background:linear-gradient(to bottom,rgb(36, 18, 1) 0%,currentColor 700%); }')
		injectCSS('.sugarFurnaceUpgrades { display: flex; }');
		injectCSS('.furnaceUpgrade { cursor: pointer; display: inline-block; position: relative; line-height: 120%; width: 50%; padding: 8px; padding-bottom: 20px; }');
		injectCSS('.furnaceUpgrade:hover { background:rgb(15, 28, 26); }');
		injectCSS('.furnaceUpgrade:active { background:rgb(88, 105, 102); }');
		injectCSS('.furnaceUpgradeLevel { position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); }');
		Game.last.buyFunction = function() {
			//simulate choiceFunction without actually using it since it has unfunny restrictions
			Game.Lock(this.name);
			Game.Unlock(this.name);
			if (Game.choiceSelectorOn == this.id) { l('toggleBox').style.display = 'none'; Game.choiceSelectorOn = -1; return; }
			Game.choiceSelectorOn = this.id;

			decay.updateFurnaceStats();

			let str = '';
			str += '<div class="close" onclick="l(\'toggleBox\').style.display = \'none\';">x</div>';
			str += '<h3>'+this.dname+'</h3>'+
				'<div class="line"></div>';
			
			str += `
			<div class="block">
				${loc('Current boost: <b><span id="furnaceBoostDisplay">+%1%</span> CpS</b>', Beautify(decay.furnaceBoost * 100 - 100, 1))}
			</div>

			<div class="line"></div>

			<div class="block sugarFurnaceChargeMain">
				<div style="margin-bottom: 4px;">${loc('Use %1 to burn and increase CpS by <b>%2 per minute</b> over <b>%3</b>, for up to <b>%4</b>', ['<span class="price lump' + (Game.lumps > 1?'':' disabled') + '">1</span>', Beautify(decay.furnaceGainPerMin * 100, 1) + '%', Game.sayTime(decay.furnaceBurnDuration * Game.fps, -1), '+' + Beautify(decay.furnaceCap * 100 - 100) + '%'])}</div>
				<div class="smallFancyButton burnButton${(decay.furnaceBurnRemaining || decay.furnaceBoost >= decay.furnaceCap)?' block':' standby'}" onclick="${decay.furnaceBurnRemaining?'':`decay.burnLumpInFurnace();`}">
					${(decay.furnaceBoost >= decay.furnaceCap)?('<b>'+loc('Capped')+'</b>'):(decay.furnaceBurnRemaining?loc('Burning<br> <b><span id="burnTimer">%1</span></b> remaining', Game.sayTime(decay.furnaceBurnRemaining, -1)):loc('Burn!'))}
				</div>
				<small>
				${loc('Auto-first burn')}
					<label style="margin-left:4px;">
						<input type="checkbox" id="autoFirstBurnOutside" ${decay.autoFirstBurnOutside ? 'checked' : ''} onchange="decay.autoFirstBurnOutside = this.checked;">
						outside
					</label>
					/
					<label style="margin-right:4px;">
						<input type="checkbox" id="autoFirstBurnInside" ${decay.autoFirstBurnInside ? 'checked' : ''} onchange="decay.autoFirstBurnInside = this.checked;">
						inside
					</label>
					Unshackled decay
				</small>
			</div>

			<div class="line"></div>

			<small>${loc('The below upgrades are kept through ascensions.')}</small>
			
			<div class="sugarFurnaceUpgrades">
				<div class="framed furnaceUpgrade" style="${(decay.furnaceCapUpgrades < decay.furnaceCapUpgradeMax)?'':'width: 100%;'}" onclick="Game.spendLump(decay.getFurnaceSpeedUpgradeCost(decay.furnaceSpeedUpgrades), loc('Upgrade furnace speed'), function() { decay.furnaceSpeedUpgrades++; decay.updateFurnaceStats(); decay.refreshFurnaceUI(); })(); ">
					${loc('<b>+%1% --> +%2%</b> per minute', [Beautify(decay.furnaceGainPerMin * 100, 1), Beautify((decay.furnaceGainPerMin + decay.furnaceSpeedUpgrades * 0.005 + 0.01) * 100, 1)])}
					<br><span class="price lump${(Game.lumps < decay.getFurnaceSpeedUpgradeCost(decay.furnaceSpeedUpgrades))?' disabled':''}">${Beautify(decay.getFurnaceSpeedUpgradeCost(decay.furnaceSpeedUpgrades))}</span>
					<div class="furnaceUpgradeLevel"><small>
						${loc('Level %1', Beautify(decay.furnaceSpeedUpgrades))}
					</small></div>
				</div>
				<div class="${(decay.furnaceCapUpgrades < decay.furnaceCapUpgradeMax)?'framed ':''}furnaceUpgrade" style="${(decay.furnaceCapUpgrades < decay.furnaceCapUpgradeMax)?'':'display: none;'}" onclick="if (decay.furnaceCapUpgradeReqs[decay.furnaceCapUpgrades].func()) { Game.spendLump(decay.furnaceCapUpgradeCosts[decay.furnaceCapUpgrades], loc('Upgrade furnace boost cap'), function() { decay.furnaceCapUpgrades++; decay.updateFurnaceStats(); decay.refreshFurnaceUI(); })(); }">
					${loc('<b>%1% --> %2%</b> boost cap', [Beautify(decay.furnaceCap * 100 - 100), Beautify(decay.furnaceCaps[decay.furnaceCapUpgrades + 1] * 100 - 100)])}
					<br><span class="price lump${(Game.lumps < decay.furnaceCapUpgradeCosts[decay.furnaceCapUpgrades])?' disabled':''}">${Beautify(decay.furnaceCapUpgradeCosts[decay.furnaceCapUpgrades])}</span> <b>&</b>
					<br><span class="${decay.furnaceCapUpgradeReqs[decay.furnaceCapUpgrades].func()?'green':'red'}" style="line-height: 40%; font-size: 13px; font-family: Merriweather, Georgia, serif; font-variant: small-caps;">${decay.furnaceCapUpgradeReqs[decay.furnaceCapUpgrades].text}</span>
					<div class="furnaceUpgradeLevel"><small>
						${loc('Level %1', Beautify(decay.furnaceCapUpgrades))}
					</small></div>
				</div>
			</div>
			
			<div class="block">${loc('Sacrifice your garden (by getting every seed) to increase cap by <b>%1</b> (additive) and add <b>+%2</b> per minute!', [Beautify(200 * 100) + '%', Beautify(200) + '%'])}</div>`

			l('toggleBox').innerHTML = str;
			l('toggleBox').style.display = 'block';
			l('toggleBox').focus();
			Game.tooltip.hide();
			PlaySound('snd/tick.mp3');
		}
		decay.refreshFurnaceUI = function() {
			Game.choiceSelectorOn = -1;
			Game.Upgrades['Glucose furnace'].buyFunction();
		}
		Game.registerHook('draw', function() {
			if (Game.choiceSelectorOn == Game.Upgrades['Glucose furnace'].id) {
				l('furnaceBoostDisplay').innerText = '+' + Beautify(decay.furnaceBoost * 100 - 100, 1) + '%';
				if (l('burnTimer')) { 
					l('burnTimer').innerText = Game.sayTime(decay.furnaceBurnRemaining, -1);
				}
			}
		});
		decay.furnaceBoost = 1;
		decay.furnaceGainPerMin = 0.1;
		decay.furnaceSpeedUpgrades = 0;
		decay.furnaceBurnDuration = 30 * 60;
		decay.furnaceCap = 2;
		decay.furnaceCapUpgrades = 0;
		decay.furnaceBurnRemaining = 0;
		decay.furnaceReadyTime = 5 * 60 * Game.fps;
		decay.autoFirstBurnOutside = false;
		decay.autoFirstBurnInside = false;
		addLoc('The Glucose furnace is ready!');
		addLoc('Look in your switches section.');
		addLoc('Sugar burning started!');
		addLoc('Finishes after %1.');
		addLoc('Sugar burning ended!');
		addLoc('Cap of +%1% reached.');
		addLoc('Current sugar burning boost: +%1%');
		decay.updateFurnace = function() {
			if (decay.furnaceBurnRemaining) {
				decay.furnaceBurnRemaining--;
				decay.furnaceBoost = Math.min(decay.furnaceBoost + decay.furnaceGainPerMin / 60 / Game.fps, decay.furnaceCap);
				if (!decay.furnaceBurnRemaining || decay.furnaceBoost >= decay.furnaceCap) {
					decay.furnaceBurnRemaining = 0;
					Game.Notify(loc('Sugar burning ended!'), (decay.furnaceBoost >= decay.furnaceCap)?loc('Cap of +%1% reached.', Beautify(decay.furnaceBoost * 100 - 100)):loc('Current sugar burning boost: +%1%', Beautify(decay.furnaceBoost * 100 - 100, 1)), [25, 2, kaizoCookies.images.custImg]);
				}
			}
			if (Game.Has('Glucose furnace') && Game.TCount >= decay.furnaceReadyTime) {
				Game.Lock('Glucose furnace');
				Game.Unlock('Glucose furnace');
				Game.Notify(loc('The Glucose furnace is ready!'), loc('Look in your switches section.'), [25, 3, kaizoCookies.images.custImg], 10, false, true);
				if ((Game.ascensionMode == 0 && decay.autoFirstBurnOutside) || (Game.ascensionMode == 42069) && decay.autoFirstBurnInside) { 
					decay.burnLumpInFurnace();
				}
			}
		}
		decay.burnLumpInFurnace = function() {
			Game.spendLump(1, loc('Burn sugar lump'), function() { 
				decay.furnaceBurnRemaining = decay.furnaceBurnDuration * Game.fps; 
				Game.Notify(loc('Sugar burning started!'), loc('Finishes after %1.', Game.sayTime(decay.furnaceBurnDuration * Game.fps, -1)), [29, 27]); 
				decay.refreshFurnaceUI(); 
			})();
		}
		decay.furnaceCaps = {
			0: 2,
			1: 3,
			2: 6,
			3: 18,
			4: 41,
			5: 101,
			6: 201
		}
		decay.furnaceCapUpgradeMax = Math.max(...Object.keys(decay.furnaceCaps));
		decay.furnaceCapUpgradeCosts = {
			0: 0,
			1: 2,
			2: 7,
			3: 15,
			4: 30,
			5: 50
		}
		addLoc('get over %1');
		addLoc('complete challenge %1');
		addLoc('heavenly upgrade %1');
		decay.furnaceCapUpgradeReqs = {
			0: {
				text: loc('get over %1', loc('%1 cookie', LBeautify(1e33))),
				func: function() {
					return Game.cookiesEarned + Game.cookiesReset > 1e33;
				}
			},
			1: {
				text: loc('complete challenge %1', 'B42'),
				func: function() {
					return decay.challenges['earthShatterer'].complete;
				}
			},
			2: {
				text: loc('complete challenge %1', 'B29'),
				func: function() {
					return decay.challenges['combo4'].complete;
				}
			},
			3: {
				text: '',
				func: function() {
					return Game.Has('Pulsatic discharge');
				}
			},
			4: {
				text: loc('???'),
				func: function() {

				}
			},
			5: {
				text: loc('???'),
				func: function() {

				}
			}
		}
		decay.getFurnaceSpeedUpgradeCost = function(from) { 
			return 1 + Math.floor(from / 2) + Math.floor(Math.pow(Math.max(from - 25, 0), 2) / 3);
		}
		decay.updateFurnaceStats = function() {
			const g = gap ?? { convertTimes: 0 };
			decay.furnaceGainPerMin = 0.04 + (0.02 + (0.01 - 0.005) + decay.furnaceSpeedUpgrades * 0.005) * decay.furnaceSpeedUpgrades / 2 + (g.convertTimes?2:0);
			decay.furnaceCap = decay.furnaceCaps[Math.min(decay.furnaceCapUpgrades, decay.furnaceCapUpgradeMax)] + (g.convertTimes?200:0);
		}
		decay.saveFurnace = function() {
			let str = '';
			str += decay.furnaceBoost + ',' + decay.furnaceBurnRemaining + ',' + decay.furnaceSpeedUpgrades + ',' + decay.furnaceCapUpgrades;
			str += ',' + (decay.autoFirstBurnInside?1:0) + ',' + (decay.autoFirstBurnOutside?1:0);
			return str;
		}
		decay.adjustFurnaceUpgradeStatus = function() {
			if (!Game.Has('Sugar burning')) { return; }

			Game.Unlock('Glucose furnace');

			if (Game.TCount < decay.furnaceReadyTime) { 
				Game.Upgrades['Glucose furnace'].bought = 1;
			}
		}
		decay.loadFurnace = function(str) {
			decay.adjustFurnaceUpgradeStatus();

			let strs = str.split(',');
			if (isv(strs[0])) { decay.furnaceBoost = parseFloat(strs[0]); }
			if (isv(strs[1])) { decay.furnaceBurnRemaining = parseFloat(strs[1]); }
			if (isv(strs[2])) { decay.furnaceSpeedUpgrades = parseFloat(strs[2]); }
			if (isv(strs[3])) { decay.furnaceCapUpgrades = parseFloat(strs[3]); }
			if (isv(strs[4])) { decay.autoFirstBurnInside = Boolean(parseInt(strs[4])); }
			if (isv(strs[5])) { decay.autoFirstBurnOutside = Boolean(parseInt(strs[5])); }

			decay.updateFurnaceStats();
		}
		decay.wipeFurnace = function() {
			decay.furnaceBoost = 1;
			decay.furnaceBurnRemaining = 0;
			decay.furnaceSpeedUpgrades = 0;
			decay.furnaceCapUpgrades = 0;
		}
		decay.updateFurnaceStats();

		allValues('lumps');

		/*=====================================================================================
        Purification
        =======================================================================================*/
		
		//ways to purify/refresh/stop decay
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('Game.Click=0;', 'Game.Click=0; decay.purifyFromShimmer(this);'));
		decay.purifyFromShimmer = function(obj) {
			if (obj.type == 'reindeer') {
				if (decay.isConditional('reindeer')) { decay.amplifyAll(2, 0); } else if (obj.noPurity) { decay.amplifyAll(10, 0); Game.Notify('LOL', '', [12, 8]); }// else { decay.purifyAll(1.3 * (1 + Game.Has('Weighted sleighs') * 0.25), 0.2, 5); decay.triggerNotif('reindeer'); }
				if (Game.Has('Weighted sleighs')) { decay.stop(7, 'reindeer'); }
				return;
			} 
			if (obj.type == 'a mistake') {
				decay.purifyAll(2, 0.5, 3.5);
				return;
			}

			if (obj.spawnLead && Game.ascensionMode == 42069 && !decay.challengeStatus("comboDragonCursor") && Game.clickMult > 1165 && !Game.hasBuff('Dragonflight') && Game.buffCount() <= 1 && !Game.Has("Santa\'s helpers") && Game.eff('click') < 1.1 && Game.auraMult("Reaper of Fields") >= 0.5) { decay.challenges.comboDragonCursor.finish(); }

			var strength = 5;
			if (decay.challengeStatus('noGC1')) { strength *= 1.15; }
			if (obj.wrath && obj.wrathTrapBoosted) { strength *= 1.5; }
			if (obj.spawnLead) {
				decay.purifyAll(strength, 1 - Math.pow((Game.resets<1?0.6:0.8), strength), 15); decay.stop(1, 'wSoulShiny');
			} else if (obj.force == 'cookie storm drop' || obj.force == 'chain cookie') {
				decay.purifyAll(Math.pow(strength, 0.01), 0.0001, 5); decay.stop(0.6, 'wSoulShiny');
			} else if (obj.force == '' && obj.type == 'golden') {
				decay.purifyAll(Math.pow(strength, 0.33), 1 - Math.pow(0.99, strength), 10); 
			}
		}
		decay.workMult = 1;
		decay.setWorkMult = function() {
			let mult = 1;
			if (decay.gen < 0.01) { mult *= 0.5011872336272722; } //equivalent to the below expression evaluated at 0.01
			else if (decay.gen < 1) { mult *= Math.pow(decay.gen, 0.15); }
			else {
				mult *= Math.pow(decay.gen, 0.4);
			}
			if (decay.covenantStatus('wrathTrap')) { mult *= 2; }
			if (Game.hasGod) {
				const lvl = Game.hasGod('industry');
				if (lvl == 1) { mult *= 2.25; }
				else if (lvl == 2) { mult *= 1.5; }
				else if (lvl == 3) { mult *= 1.2; }
			}
			if (Game.hasBuff('Enhanced clicks')) { mult *= 3; }
			mult *= decay.workProgressMult;
			decay.workMult = mult;
			return mult;
		}
		decay.clickHaltMult = 1;
		decay.setClickHaltMult = function() {
			let base = 1;
			let offbrandAdd = 1;
			for (let i in decay.offBrandFingers) {
				if (decay.offBrandFingers[i].bought) { offbrandAdd += 0.1; }
			}
			base *= offbrandAdd;
			base *= 1 / (1 + Game.log10CookiesSimulated / 20 + Math.max(Game.log10CookiesSimulated - 12, 0) / 24);
			if (decay.challengeStatus('purity1')) { base *= 1.1; }
			let monument = 1;
			if (Game.Has('Blessed monuments')) { monument += 0.1; }
			if (Game.Has('Paint of proof')) { monument += 0.1; }
			if (Game.Has('Integrated alloys')) { monument += 0.1; }
			base *= monument;
			//base *= 1 + Math.max(12 - Game.log10CookiesSimulated, 0) / 12;
			if (decay.exhaustion > 0 && !Game.veilOn()) { base *= 1 - Math.min(decay.times.sinceLastExhaustion / (Game.fps * 5), 1); }
			if (decay.covenantStatus('click')) { base /= 2; }
			if (decay.isConditional('reindeer')) { base *= 1.5; }
			if (decay.isConditional('knockbackTutorial')) { base *= 3; }
			if (Game.hasGod) {
				const lvl = Game.hasGod('industry');
				if (lvl == 1) { base *= 2.25; }
				else if (lvl == 2) { base *= 1.5; }
				else if (lvl == 3) { base *= 1.2; }
			}
			if (decay.covenantStatus('wrathTrap')) { base *= 2; }
			if (Game.hasBuff('Enhanced clicks')) { base *= 3; }

			return base;
		}
		decay.clickBCStop = function() {
			if (!decay.unlocked) { return; }
			let base = decay.clickHaltBaseTime;
			decay.clickHaltMult = decay.setClickHaltMult();
			base *= decay.clickHaltMult;
			decay.stop(base, 'click');

			if (Game.Has('Touch of nature') && Math.random() < 0.01) { decay.purifyAll(1.05, 0, 100); }

			if (decay.exhaustion > 0 || Game.veilOn()) { return; }

			decay.setWorkMult();
			decay.work(decay.clickWork * decay.workMult);
		}
		Game.registerHook('click', decay.clickBCStop);
		decay.bounceBackInForce = 0;
		Game.lastClickCount = Date.now();
		eval('Game.Logic='+Game.Logic.toString()
			.replace(`//if (Game.BigCookieState==2 && !Game.promptOn && Game.Scroll!=0) Game.ClickCookie();`, `if (Game.bigCookieHovered && !(decay.powerClicksOn() && Game.Has('Mammon') && decay.power >= decay.firstPowerClickReq) && !decay.isConditional('reindeer') && ((decay.prefs.scrollClick && Game.Scroll!=0) || (Game.keys[65] && decay.prefs.touchpad) || decay.easyClicksEnable) && !Game.promptOn && Date.now()-Game.lastClickCount >= 105) { Game.ClickCookie(); Game.BigCookieState = 1; decay.bounceBackInForce = 1 + randomFloor(Math.random()); }`)
			.replace(`Beautify(Game.prestige)]);`, `Beautify(decay.getCpSBoostFromPrestige())]);`)
		);
		decay.halts['reindeer'] = new decay.haltChannel({
			properName: loc('Reindeers'),
			keep: 0.4,
			overtimeEfficiency: 1,
			overtimeDec: 0,
			overtimeLimit: 100,
		});
		Game.registerHook('logic', function() {
			if (decay.bounceBackInForce > 0) {
				decay.bounceBackInForce--;
				if (decay.bounceBackInForce <= 0) { Game.BigCookieState = 2; }
			}
		});
		Game.registerHook('click', function() {
			Game.lastClickCount = Math.max(Date.now() - 250, Game.lastClickCount + 100);
		});
		let clickHaltDisplayContainer = document.createElement('div');
		clickHaltDisplayContainer.id = 'clickHaltDisplayContainer';
		clickHaltDisplayContainer.style.display = 'none';
		injectCSS(`#clickHaltDisplayContainer { min-height: 24px; background:#999; background:url(img/darkNoise.jpg); width: 100%; box-shadow:0px 0px 4px #000 inset; position: relative; text-align: center; margin-bottom: 8px; }`);
		injectCSS(`#game.onMenu #clickHaltDisplayContainer { display: none; }`);
		injectCSS(`#clickHaltTitle { white-space: nowrap; width: 100%; text-align: center; text-shadow: rgb(111, 109, 109) 0px 1px 4px; font-size: 12px; font-style: bold; color: #bbb; }`);
		injectCSS(`.clickHaltCell { display: table-cell; text-align: center; display: inline-flex; justify-content: center; align-items: center; width: 25%; z-index: 1; }`);
		l('buildingsMaster').insertAdjacentElement('beforebegin', clickHaltDisplayContainer);
		clickHaltDisplayContainer.innerHTML = `
		<div style="width: 100%; padding-bottom: 12px; padding-top: 8px; vertical-align: middle;" ${Game.getDynamicTooltip('decay.clickHaltDisplayTooltip', 'bottom', true)}>
			<div id="clickHaltTitle">
				<- less time - <span style="color: #eee;">Click-o-meter</span> - more time ->
			</div>
			<div style="white-space: nowrap; width: 100%;" id="clickHaltProgress">
				<div style="height: 16px; width: 100%; position: absolute; top: 50%; transform: translateY(-25%);  background: linear-gradient(to top, rgba(255, 255, 255, 0) 0%, rgba(79, 87, 87, 0.3) 50%, rgba(255, 255, 255, 0) 100%), linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(50, 54, 54, 0.2) 100%)"></div>
				<div id="clickHaltCell1" class="clickHaltCell" style="opacity: 0;">
					<div class="icon" style="${writeIcon([5, 2, kaizoCookies.images.custImg])}; z-index: 1;"></div>
				</div>
				<div id="clickHaltCell2" class="clickHaltCell" style="opacity: 0;">
					<div class="icon" style="${writeIcon([10, 0])}; z-index: 1;"></div>
				</div>
				<div id="clickHaltCell3" class="clickHaltCell" style="opacity: 0;">
					<div class="icon" style="${writeIcon([0, 3])}; z-index: 1;"></div>
				</div>
				<div id="clickHaltCell4" class="clickHaltCell" style="opacity: 0;">
					<div class="icon" style="${writeIcon([18, 1, kaizoCookies.images.custImg])}; z-index: 1;"></div>
				</div>
			</div>
		</div>
		<div class="separatorBottom" style="position:absolute;bottom:-8px;z-index:0;"></div>
		<div class="productButtons" style="margin-bottom: -8px;">
			<div class="productButton productMute" id="clickHaltUnmuteButton" ${Game.getTooltip('<div style="width:150px;text-align:center;font-size:11px;" id="tooltipMuteBuilding"><b>'+loc("Show")+'</b><br>('+loc("Show the Click-o-meter")+')</div>','this')} onclick="decay.showClickHaltDisplay();" style="display: none;">Show</div>
			<div class="productButton productMute" id="clickHaltMuteButton" ${Game.getTooltip('<div style="width:150px;text-align:center;font-size:11px;" id="tooltipMuteBuilding"><b>'+loc("Hide")+'</b><br>('+loc("Minimize the Click-o-meter")+')</div>','this')} onclick="decay.hideClickHaltDisplay();" style="">Hide</div>
		</div>
		`; //this is truly a mess
		addLoc('Minimize the Click-o-meter');
		addLoc('Show the Click-o-meter');
		addLoc('Hide');
		addLoc('Click-o-meter unlocked!');
		addLoc('Check it out at the top the middle section.');
		addLoc('This meter shows for how long your clicks will keep decay halted');
		addLoc('Amount of time left: <b>%1</b>');
		Game.registerHook('check', function() {
			if (Game.cookiesEarned + Game.cookiesReset > 1e6 && l('clickHaltDisplayContainer').style.display == 'none') {
				l('clickHaltDisplayContainer').style.display = ''; 
				Game.Notify(loc('Click-o-meter unlocked!'), loc('Check it out at the top the middle section.'), [18, 0, kaizoCookies.images.custImg], 1e20, false, true);
			}
		});
		decay.clickHaltDisplayTooltip = function() { 
			const c = decay.halts.click;
			return '<div style="width: 480px; text-align: center; padding: 3px;">' + loc('This meter shows for how long your clicks will keep decay halted.') + ((Game.Has('Click-o-meter extension') && c.overtime)?('<div class="line"></div>' + loc('Amount of time left: <b>%1</b>', Game.sayTime(c.overtime / (decay.decHalt * Math.pow(Math.max(decay.rateTS / decay.acceleration, 1), c.tickspeedPow) * c.decMult / Game.fps), -1))):'') + '</div>';
		}
		decay.clickHaltDisplayHidden = false;
		decay.hideClickHaltDisplay = function() {
			l('clickHaltProgress').style.display = 'none';
			//l('clickHaltTitle').style.display = 'none';
			l('clickHaltMuteButton').style.display = 'none';
			l('clickHaltUnmuteButton').style.display = '';
			decay.clickHaltDisplayHidden = true;
		}
		decay.showClickHaltDisplay = function() {
			l('clickHaltProgress').style.display = '';
			//l('clickHaltTitle').style.display = '';
			l('clickHaltMuteButton').style.display = '';
			l('clickHaltUnmuteButton').style.display = 'none';
			decay.clickHaltDisplayHidden = false;
		}
		decay.clickHaltElementsList = [l('clickHaltCell1'), l('clickHaltCell2'), l('clickHaltCell3'), l('clickHaltCell4')];
		Game.registerHook('draw', function() {
			if (decay.clickHaltDisplayHidden) { return; }
			let frac = decay.halts.click.overtime / decay.halts.click.overtimeLimit * decay.clickHaltElementsList.length;
			for (let i = 0; i < decay.clickHaltElementsList.length; i++) {
				decay.clickHaltElementsList[i].style.opacity = (Math.pow(Math.min(Math.max(frac - i, 0), 1), 0.25));
			}
		});
		addLoc('Decay propagation rate -%1% for %2!');
		new Game.buffType('creation storm', function(time, pow) {
			return {
				name: 'Storm of creation',
				desc: loc('Decay propagation rate -%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
				icon: [30, 5],
				time: time*Game.fps,
				add: false,
				max: true
			}
		});

		//breaking point
		replaceDesc('Legacy', "This is the first heavenly upgrade; it unlocks the <b>Heavenly chips</b> system.<div class=\"line\"></div>Each time you ascend, the cookies you made in your past life are turned into <b>heavenly chips</b> and <b>prestige</b>.<div class=\"line\"></div><b>Heavenly chips</b> can be spent on a variety of permanent transcendental upgrades.<div class=\"line\"></div>Your <b>prestige level</b> also gives you a permanent <b>+1% CpS</b> per level.<div class=\"line\"></div>Decay starts to <b>break after -90%</b>, becoming more powerful the more decay you have: ascending is no longer immediate and you gain a decay propagation increase that scales with current decay.<div class=\"line\"></div>In addition, wrinklers have also inherited a part of the power: popping any that has already reached the big cookie will now inflict Coagulated and Cursed, and their speed also increases the more decay you have, for up to the point where decay breaks.<q>We've all been waiting for you. And some more.</q>");
		Game.Upgrades['Legacy'].icon = [7, 3, kaizoCookies.images.custImg];
		decay.minimumPrestigeAmountToAscend = 300; 
		decay.eligibleForAscend = function() {
			if (Game.resets >= 1) { return true; }
			let chips = Math.pow(Game.cookiesEarned / Game.firstHC, 1 / Game.HCfactor);
			return (chips > decay.minimumPrestigeAmountToAscend);
		}
		addLoc('You cannot ascend right now, as you have not yet earned enough cookies. <br>Ascending for the first time requires a minimum of <b>%1</b> heavenly chips.');
		decay.cannotAscendPrompt = function() {
			Game.Prompt('<id Ascend><h3>'+loc("Ascend")+'</h3><div class="block">'+loc('You cannot ascend right now, as you have not yet earned enough cookies. <br>Ascending for the first time requires a minimum of <b>%1</b> heavenly chips.', decay.minimumPrestigeAmountToAscend)+'</div>',[[loc("Ok"),'Game.ClosePrompt();','']]);
		}
		decay.ascendIn = 0;
		addLoc('Ascending cancelled!');
		eval('Game.Ascend='+Game.Ascend.toString()
			 .replace('if', 'if (!decay.eligibleForAscend()) { decay.cannotAscendPrompt(); } else if')
			 .replace('Game.Notify', 'decay.ascendIn = 0; Game.Notify')
			);

		//purification: elder pledge & elder covenant
		this.changePledge = function () {
			Game.UpgradesById[64].basePrice /= 1000000;
			Game.UpgradesById[65].basePrice /= 1000000;
			Game.UpgradesById[66].basePrice /= (1000000 / 4);
			Game.UpgradesById[67].basePrice /= (1000000 / 16);
			Game.UpgradesById[68].basePrice /= (1000000 / 64);
			Game.UpgradesById[69].basePrice /= (1000000 / 256);
			Game.UpgradesById[70].basePrice /= (1000000 / 1024);
			Game.UpgradesById[71].basePrice /= (1000000 / 4096);
			Game.UpgradesById[72].basePrice /= (1000000 / 16384);
			Game.UpgradesById[73].basePrice /= (1000000 / 65536);
			Game.UpgradesById[87].basePrice *= 1000000;
			Game.registerHook('check', function () {
				if (Game.Objects['Grandma'].amount >= 25) { Game.Unlock('Bingo center/Research facility'); }
				if (Game.pledges >= 5) { Game.Unlock('Sacrificial rolling pins'); }
			});
			Game.elderWrath = 0;
			Game.Upgrades['Bingo center/Research facility'].buyFunction = function() {
				Game.SetResearch('Specialized chocolate chips');
				Game.Win('Grandmapocalypse');
			}
			eval('Game.SetResearch=' + Game.SetResearch.toString().replace(`if (Game.Has('Persistent memory')) Game.researchT=Math.ceil(Game.baseResearchTime/10);`, `if (Game.Has('Persistent memory')) { Game.researchT /= 2; } if (decay.challengeStatus('pledge')) { Game.researchT /= 2; } if (Game.Has('Memory capsule')) { Game.researchT /= 2; } Game.researchT = Math.ceil(Game.researchT);`));
			replaceDesc('Persistent memory', 'Subsequent research will be <b>twice</b> as fast.<q>It\'s all making sense!<br>Again!</q>');
			replaceDesc('One mind', 'Each grandma gains <b>+0.0<span></span>2 base CpS per grandma</b>.<br>Also unlocks the <b>Elder Pledge</b>, which slowly purifies the decay for some cookies.<q>Repels the ancient evil with industrial magic.</q>');
			Game.Upgrades['One mind'].buyFunction = function () { Game.SetResearch('Exotic nuts'); Game.storeToRefresh = 1; }
			replaceDesc('Exotic nuts', 'Cookie production multiplier <b>+4%</b>, and reduces the Elder Pledge cooldown by <b>30 seconds</b>.<q>You\'ll go crazy over these!</q>');
			replaceDesc('Communal brainsweep', 'Each grandma gains another <b>+0.0<span></span>2 base CpS per grandma</b>, and makes the Elder Pledge purify for <b>20% more time</b>.<q>Burns the corruption with the worker\'s might.</q>');
			Game.Upgrades['Communal brainsweep'].buyFunction = function () { Game.SetResearch('Arcane sugar'); Game.storeToRefresh = 1; }
			replaceDesc('Arcane sugar', 'Cookie production multiplier <b>+5%</b>, and reduces the Elder Pledge cooldown by <b>30 seconds</b>.<q>Tastes like insects, ligaments, and molasses.</q>');
			replaceDesc('Elder Pact', 'Each grandma gains <b>+0.0<span></span>5 base CpS per portal</b>, and makes the Elder Pledge <b>10%</b> more powerful.<q>Questionably unethical.</q>');
			Game.Upgrades['Elder Pact'].buyFunction = function () { decay.covenantModes.off.upgrade.bought = 0; Game.Unlock('Memory capsule'); Game.storeToRefresh = 1; Game.Win('Elder calm'); }
			replaceDesc('Sacrificial rolling pins', 'The Elder Pledge is <b>10 times</b> as cheap.<q>As its name suggests, it suffers so that everyone can live tomorrow.</q>');
			Game.Upgrades['One mind'].clickFunction = function () { return true; };
			Game.Upgrades['Elder Pact'].clickFunction = function () { return true; };
			replaceAchievDesc('Elder nap', 'Use the Elder Pledge to purify decay at least <b>once</b>.<q>decay<br>shall<br>begone</q>');
			replaceAchievDesc('Elder slumber', 'Use the Elder Pledge to purify decay <b>5 times</b> in a run.<q>purity transcends<br>all<br>evil</q>');
			replaceAchievDesc('Elder calm', 'Unlock the Elder Covenant.<q>our final gift...<br>use it...<br>well...</q>');
			replaceAchievDesc('Grandmapocalypse', 'Start the <b>Bingo researches</b> by purchasing the research facility.<q>An apocalypse... for decay!</q>');

			replaceDesc('Elder Pledge', 'Purifies the decay, at least for a short while.<br>Price is equal to 5 minutes of highest raw CpS reached this ascension.<q>Incredible power lies within.</q>');
			decay.halts['pledge'] = new decay.haltChannel({
				properName: loc('Elder Pledge'),
				keep: 10,
				overtimeLimit: 100,
				overtimeEfficiency: 0.05,
				power: 0.5,
			});
			Game.Upgrades['Elder Pledge'].buyFunction = function () {
				Game.pledges++;
				Game.pledgeT = Game.getPledgeDuration();
				decay.stop(2 + 4 * Game.Has('Uranium rolling pins'), 'pledge');
				Game.storeToRefresh = 1;
			}
			Game.Upgrades['Elder Pledge'].priceFunc = function () {
				return Game.cookiesPsRawHighest * 300 * (Game.Has('Sacrificial rolling pins') ? 0.1 : 1);
			}
			Game.Upgrades['Elder Pledge'].icon.push('img/icons.png');
			Game.Upgrades['Elder Pledge'].displayFuncWhenOwned = function () {
				if (Game.pledgeT > 0) {
					return '<div style="text-align:center;">' + loc("Time remaining until pledge runs out:") + '<br><b>' + Game.sayTime(Game.pledgeT, -1) + '</b></div>';
				} else {
					return '<div style="text-align:center;">' + loc("Elder Pledge will be usable again in:") + '<br><b>' + Game.sayTime(Game.pledgeC, -1) + '</b></div>';
				}
			}
			Game.Upgrades['Elder Pledge'].timerDisplay = function () {
				if (!Game.Upgrades['Elder Pledge'].bought) {
					return -1;
				} else if (Game.pledgeT > 0) {
					return 1 - Game.pledgeT / Game.getPledgeDuration();
				} else {
					return 1 - Game.pledgeC / Game.getPledgeCooldown();
				}
			}
			Game.getPledgeDuration = function () {
				var dur = Game.fps * 30;
				if (Game.Has('Communal brainsweep')) {
					dur *= 1.2;
				}
				if (Game.Has('Unshackled Elder Pledge')) { dur *= 1.25; }
				return dur;
			}
			Game.getPledgeStrength = function () {
				var str = 0.06;
				if (Game.Has('Elder Pact')) { str *= 1.1; }
				if (Game.Has('Unshackled Elder Pledge')) { str *= 1.25; }
				var cap = 6;
				if (Game.Has('Elder Pact')) { cap *= 1.1; }
				return [1 + (str / Game.fps), 0.5 / (Game.getPledgeDuration() * cap), cap];
			}
			Game.getPledgeCooldown = function () {
				var c = Game.fps * 7.5 * 60;
				if (Game.Has('Exotic nuts')) { c -= 30 * Game.fps; }
				if (Game.Has('Arcane sugar')) { c -= 30 * Game.fps; }

				if (Game.Has('Unshackled Elder Pledge')) { c *= 0.75; }
				return c;
			}
			Game.pledgeC = 0;
		};

		addLoc('Elder Covenant');
		decay.covenantModes = {};
		decay.covenantSwitchOrder = ['off', 'wrathBan', 'wrathTrap', 'click', 'powerGain', 'aura', 'gardenTick', 'spellWorship', 'frenzyStack', 'dragonStack'];
		decay.covenantMode = function(name, dname, desc, unlockCondition) {
			addLoc(dname);
			addLoc(desc);
			this.name = name;
			this.dname = dname;
			this.upgrade = new Game.Upgrade('Elder Covenant'+' ['+name+']', desc, 0, [8, 9]);
			this.upgrade.order = 15001;
			this.upgrade.pool = 'toggle';
			this.upgrade.dname = loc('Elder Covenant') + ' [' + loc(dname) + ']';
			this.upgrade.buyFunction = function(n) { return function() { decay.chooseNextMode(n); } }(this.name); //wtf
			this.upgrade.bought = 1;
			this.upgrade.unlocked = 1;
			this.unlocked = false;
			this.unlockCondition = unlockCondition;

			decay.covenantModes[this.name] = this;
		}
		decay.isCovenantUnlocked = function() { return Game.Has('Elder Pact'); }
		decay.nextMode = null;
		decay.chooseNextMode = function(currentMode) {
			let pos = decay.covenantSwitchOrder.indexOf(currentMode);
			while(true) {
				pos++;
				if (pos >= decay.covenantSwitchOrder.length) { pos = 0; }
				if (decay.covenantModes[decay.covenantSwitchOrder[pos]].unlocked) { decay.nextMode = decay.covenantSwitchOrder[pos]; break; }
			}
			decay.nextModeIn = decay.modeSwitchTime; 
			Game.Upgrades['Elder Covenant [switching]'].earn();
		}
		addLoc('Covenant mode switched!');
		addLoc('Your covenant mode is now: ');
		decay.updateCovenant = function() {
			if (decay.nextMode) {
				decay.nextModeIn--;
				if (decay.nextModeIn <= 0) { Game.Lock('Elder Covenant [switching]'); Game.Lock(decay.covenantModes[decay.nextMode].upgrade.name); Game.Unlock(decay.covenantModes[decay.nextMode].upgrade.name); Game.Notify(loc('Covenant mode switched!'), loc('Your covenant mode is now: ')+'<b>'+loc(decay.covenantModes[decay.nextMode].upgrade.dname)+'</b>', [8, 9]); decay.nextMode = null; } 
			}
		}
		decay.modeSwitchTime = 1.5 * Game.fps;
		decay.nextModeIn = 0;
		let switchingCovenant = new Game.Upgrade('Elder Covenant [switching]', 'The Elder Covenant is preparing to switch modes...', 0, [8, 9]);
		switchingCovenant.order = 15001;
		switchingCovenant.pool = 'toggle';
		switchingCovenant.timerDisplay = function() { return 1 - decay.nextModeIn/decay.modeSwitchTime; };
		addLoc('Time remaining until next mode:');
		switchingCovenant.displayFuncWhenOwned = function() { return '<div style="text-align:center;">'+loc("Time remaining until next mode:")+'<br><b>'+Game.sayTime(decay.nextModeIn,-1)+'</b></div>'; }
		decay.checkCovenantModeUnlocks = function() {
			for (let i in decay.covenantModes) {
				decay.covenantModes[i].unlocked = decay.covenantModes[i].unlockCondition();
			}
		}
		Game.registerHook('check', decay.checkCovenantModeUnlocks);
		Game.registerHook('reset', decay.checkCovenantModeUnlocks);
		decay.covenantStatus = function(mode) {
			return (Game.Has('Elder Pact') && !decay.covenantModes[mode].upgrade.bought);
		}
		decay.getCurrentCovenantMode = function() {
			for (let i in decay.covenantModes) {
				if (!decay.covenantModes[i].upgrade.bought) { return i; }
			}
			return 'NA'; //"N/A" breaks the save so we are getting rid of that slash
		} 
		decay.trueFunc = function() { return true; };
		decay.createCovenantModes = function() {
			new decay.covenantMode('off', 'off', 'Switches between different modes, each one giving an unique bonus with an unique drawback.', decay.trueFunc);
			//key is not updated for safety sake
			new decay.covenantMode('wrathBan', 'holy', 'Decay rates <b>-70%</b> while having no purity, but CpS <b>-98%</b>.<q>Blocks an outlet for decay using a portion of your production.</q>', decay.trueFunc);
			new decay.covenantMode('wrathTrap', 'energized', 'Clicking halts decay <b>twice</b> as fast, but fatigue also builds up <b>twice</b> as fast.<q>Motivates you to be faster, stronger, and better, but...</q>', decay.trueFunc);
			eval('Game.shimmerTypes.golden.missFunc='+Game.shimmerTypes.golden.missFunc.toString().replace('Game.missedGoldenClicks++;', `{ Game.missedGoldenClicks++; } if (me.wrathTrapBoosted && me.wrath && me.force == "") { Game.gainBuff("smited", 44, 0.2); Game.Popup('<div style="font-size:80%;">'+loc('Wrath cookie disappeared, cookie smited!')+'</div>', me.x, me.y); }`));
			addLoc('Cookie production -%1 for %2!');
			addLoc('Wrath cookie disappeared, cookie smited!');
				new Game.buffType('smited', function(time, pow) {
				return {
					name: 'Smited',
					desc: loc('Cookie production -%1 for %2!', [((1 - pow) * 100)+'%', Game.sayTime(time, -1)]),
					icon: [15, 5],
					time: time * Game.fps,
					add: true,
					multCpS: pow,
					aura: 2
				}
			});
			//new decay.covenantMode('energyConservation', 'conservative', 'Fatigue buildup <b>-25%</b>, but decay halting from clicks lasts <b>half</b> as long.<q>Clicks softened with mattresses aplenty, it remedies fatigue at the cost of damaging its effectiveness.</q>', function() { return Game.cookiesEarned >= decay.featureUnlockThresholds.fatigue; });
			new decay.covenantMode('click', 'boosted clicks', 'Click power <b>+25%</b>, but decay halting from clicks lasts <b>half</b> as long.<q>Redirects your focus to the cookie-making ability of your clicks, with the side effect of decreasing its decay halting ability.</q>', decay.trueFunc);
			new decay.covenantMode('aura', 'draconic imbalance', 'The aura slot on the right is <b>50%</b> more powerful, but the aura slot on the left is <b>50%</b> less powerful.<q>As the prophecy foretold, one wing is always lighter than the other.</q>', function() { return (Game.dragonLevel >= 27); });
			Game.registerHook('cookiesPerClick', function(m) { if (decay.covenantStatus('click')) { m *= 1.25; } return m; });
			new decay.covenantMode('frenzyStack', 'frenzied', 'If a golden cookies spawned with this covenant mode gives Frenzy while a Frenzy is already ongoing, it will halves its duration and increase the strength of the ongoing Frenzy by <b>25%</b>, for up to <b>+400%</b> strength.<q>It\'s time to party!</q>', function() { return decay.challengeStatus('buffStack'); });
			new decay.covenantMode('dragonStack', 'plentiful harvests', 'If a golden cookies spawned with this covenant mode gives Dragon Harvest while a Dragon Harvest is already ongoing, it will halves its duration and increase the strength of the ongoing Dragon Harvest by <b>+150%</b>, for up to <b>+250%</b> strength.<q>A bounty for the patient.</q>', function() { /*return decay.challengeStatus('combo6');*/ return false; });
			addLoc('Frenzy strengthened!'); addLoc('Dragon Harvest strengthened!');
			addLoc('Frenzy strength maximum reached!'); addLoc('Dragon Harvest strength maximum reached!');
			addLoc('%1x CpS multiplier');
			addLoc('-%1 Frenzy duration!'); addLoc('-%1 Dragon Harvest duration!');
			eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString()
				 .replace(`buff=Game.gainBuff('frenzy',Math.ceil(77*effectDurMod),7);`, `if (me.canBoostFrenzy && Game.hasBuff('Frenzy')) { let F = Game.hasBuff('Frenzy'); if (F.multCpS >= 7 * 10) { popup=loc('Frenzy strength maximum reached'); } if (F.multCpS < 7 * 5) { popup=loc("Frenzy strengthened!")+'<br><small>'+loc("+%1!",loc("%1x CpS multiplier", Math.min(7 * 0.25, 7 * 5 - F.multCpS)))+'</small><br><small>'+loc("-%1 Frenzy duration!", Game.sayTime(F.time / 2, -1))+'</small>'; F.multCpS = Math.min(7 * 5, F.multCpS + 0.25 * 7); F.time /= 2; F.time = Math.floor(F.time); } } else { buff=Game.gainBuff('frenzy',Math.ceil(77*(Game.Has('Chance encounter')?1.35:1)*effectDurMod),7); }`)
				 .replace(`buff=Game.gainBuff('dragon harvest',Math.ceil(60*effectDurMod),15);`, `if (me.canBoostDH && Game.hasBuff('Dragon Harvest')) { let DH = Game.hasBuff('Dragon Harvest'); let DHBase = (Game.Has('Dragon Fang')?15:17); if (DH.multCpS >= DHBase * 3.5) { popup=loc('Dragon Harvest strength maximum reached!'); } if (DH.multCpS < DHBase * 3.5) { popup=loc("Dragon Harvest strengthened!")+'<br><small>'+loc("+%1!",loc("%1x CpS multiplier", Math.min(DHBase * 1.5, DHBase * 3.5 - DH.multCpS)))+'</small><br><small>'+loc("-%1 Dragon Harvest duration!", Game.sayTime(DH.time / 2, -1))+'</small>'; DH.multCpS = Math.min(DHBase * 3.5, DH.multCpS + DHBase * 1.5); DH.time /= 2; DH.time = Math.floor(DH.time); } } else { buff=Game.gainBuff('dragon harvest',Math.ceil(60*effectDurMod),15); }`)
			);
			new decay.covenantMode('gardenTick', 'artifical lights', 'Claiming shiny wrinkler souls have a <b>50%</b> chance to trigger a garden tick with <b>3x mutation rates</b> instead of spawning a golden cookie.<q>An unholy mass, glowing as bright as the sun.</q>', function() { return decay.utenglobeUnlocked; });
			new decay.covenantMode('spellWorship', 'sacred', 'All Grimoire spells are <b>10% cheaper</b>, but also costs 1 worship swap.', decay.trueFunc);
			new decay.covenantMode('powerGain', 'powerful', 'You gain <b>25%</b> more power, but power orbs <b>no longer spawn</b>.<q>This power is truly fearsome.</q>', function() { return Game.Has('Twin Gates of Transcendence'); });
		}
		decay.createCovenantModes();

		decay.setupCovenant = function() {
			for (let i in decay.covenantModes) {
				decay.covenantModes[i].upgrade.bought = 1;
				decay.covenantModes[i].upgrade.unlocked = 1;
			}
		}
		decay.setupCovenant();
		Game.registerHook('reincarnate', decay.setupCovenant);

		Game.Lock('Elder Covenant');
		Game.Lock('Revoke Elder Covenant');
		
		addLoc('You also gained some extra purity!');
		addLoc('Purification complete!');
		eval('Game.UpdateGrandmapocalypse='+Game.UpdateGrandmapocalypse.toString()
			 .replace('Game.elderWrath=1;', 'if (decay.gen > 1) { Game.Notify(loc("Purification complete!"), loc("You also gained some extra purity!")); } else { Game.Notify(loc("Purification complete!"), ""); }')
			 .replace(`Game.Lock('Elder Pledge');`,'Game.pledgeC = Game.getPledgeCooldown(); Game.pledgeT = 0; Game.Upgrades["Elder Pledge"].icon[0] = 6; Game.Upgrades["Elder Pledge"].icon[1] = 3; Game.Upgrades["Elder Pledge"].icon[2] = kaizoCookies.images.custImg;') //truly a hack of all time
			 .replace(`Game.Unlock('Elder Pledge');`, 'decay.times.sincePledgeEnd = 0; Game.upgradesToRebuild = 1;')
			 .replace(`(Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0)`, `(Game.Has('One mind') && Game.Upgrades['Elder Pledge'].unlocked==0)`)
			 .replace('Game.elderWrath=1;', '').replace('Game.elderWrath++;', '').replace(`Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0`, 'false')
			 .replace(`Game.UpdateWrinklers();`, '')
			 .replace('if (Game.pledgeT==0)', 'if (Game.pledgeT<=0)')
			 .replace(`if (Game.Has('Elder Covenant') || Game.Objects['Grandma'].amount==0) Game.elderWrath=0;`, `if (false) { }`)
		);
			
		if (Game.ready) { this.changePledge(); } else { Game.registerHook('create', this.changePledge); }

		decay.purityKeyState = 0; //0 used or unbought, 1 pending activation, 2 primed
		addLoc('Purity key activated!'); addLoc('You purified all of your decay!');
		addLoc('Purity key charged!');
		decay.purityKeyPurify = function() {
			decay.purifyAll(5, 1, 1);
			Game.gainBuff('pureSuppression', 36);
			let list = Crumbs.getObjects('w');
			for (let i in list) {
				if (!list[i] || list[i].dead) { continue; }
				list[i].dist += 0.25;
				decay.damageWrinkler.call(list[i], 10000);
				list[i].hurt += 1000;
			}
			decay.stop(5, 'click');
			decay.stop(5, 'click');
			decay.bigCookieShockwave(1);
			
			decay.setWrinklersAll();
			Game.Notify(loc('Purity key activated!'), loc('You purified all of your decay!'), [20, 3, kaizoCookies.images.custImg]);
			decay.purityKeyState = 0;
		}
		Game.registerHook('logic', function() {
			if (!(decay.gen < decay.breakingPoint && decay.purityKeyState == 2)) { return; }
				
			decay.purityKeyPurify();
		});
		addLoc('Pure suppression');
		addLoc('Wrinkler spawning completely nullified for %1!');
		new Game.buffType('pureSuppression', function(time, pow) {
			return {
				name: 'Pure suppression',
				desc: loc('Wrinkler spawning completely nullified for %1!', Game.sayTime(time)),
				icon: [18, 2, kaizoCookies.images.custImg],
				time: time * Game.fps,
				aura: 1
			}
		});

		allValues('decay purification & halt');
		
		//decay halt: shimmering veil
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`Game.Has('Shimmering veil [off]')`, 'false'));
		Game.veilHP = 500;
		Game.veilCollapseAt = 0.1;
		Game.veilMaxHP = 0;
		Game.setVeilMaxHP = function() {
			var h = 1000;
			if (Game.Has('Reinforced membrane')) { h *= 1.35; }
			Game.veilMaxHP = h;
		}
		Game.registerHook('reincarnate', function() { if (Game.Has('Shimmering veil')) { Game.veilPreviouslyCollapsed = false; Game.setVeilMaxHP(); Game.veilHP = Game.veilMaxHP; if (decay.isConditional('veil')) { Game.Upgrades['Shimmering veil [on]'].bought = 0; Game.Upgrades['Shimmering veil [off]'].bought = 1; } else { Game.Upgrades['Shimmering veil [on]'].bought = 1; Game.Upgrades['Shimmering veil [off]'].bought = 0; Game.Upgrades['Shimmering veil [off]'].unlock(); } } });
		replaceDesc('Shimmering veil', 'Unlocks the <b>Shimmering veil</b>, which is a toggleable veil that <b>protects you from exhaustion</b>, preventing fatigue buildup and can temporarily reverse exhaustion. The veil is damaged over time.<q>Stars contain purity, whose heat repels and destroys the decay. With this veil brings a galaxy of stars at your disposal; though they are merely an image of the real thing, their shine still significantly halts the ever-growing decay.</q>');
		Game.getVeilBoost = function() {
			//this time it is for the fraction of decay that the veil takes on
			if (Game.Has('Glittering edge')) { return 0.2; }
			return 0;
		}
		Game.getVeilCost = function(fromCollapse) {
			var n = 600;
			if (Game.Has('Steadfast murmur')) { n *= 0.25; }
			return n * Game.cookiesPsRawHighest;
		}
		Game.getVeilCooldown = function() {
			var c = Game.fps * 60 * 12;
			if (Game.Has('Delicate touch')) { c *= 0.7; }
			return c;
		}
		Game.getVeilReturn = function() {
			//the amount of decay that the veil returns on collapse
			var r = 2.89;
			if (Game.Has('Reinforced membrane')) { r *= 0.9; }
			if (Game.Has('Delicate touch')) { r *= 0.9; }
			if (Game.Has('Steadfast murmur')) { r *= 0.9; }
			if (Game.Has('Glittering edge')) { r *= 0.9; }
			if (Game.Has('Sparkling wonder')) { r *= 0.9; }
			return r;
		}
		addLoc('This Shimmering Veil is currently protecting you from <b>%1</b>.');
		addLoc('your exhaustion');
		addLoc('fatigue buildup');
		addLoc('Price scales with highest raw CpS reached this ascension.');
		addLoc('Turning it off will also incur some damage to the veil itself.');
		Game.Upgrades['Shimmering veil [on]'].descFunc = function(){
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc('This Shimmering Veil is currently protecting you from <b>%1</b>.',[decay.exhaustion?loc('your exhaustion'):loc('fatigue buildup')]) + '<br>' + loc('Turning it off will also incur some damage to the veil itself.') + '<br>' + loc('Price scales with highest raw CpS reached this ascension.') + '<q>Let fate be in your hands.</q>';
		}
		addLoc('If activated, this veil will protect you from <b>%1</b>.');
		addLoc('Your veil has previously collapsed, so this activation will require <b>%1x</b> more cookies than usual.');
		Game.Upgrades['Shimmering veil [off]'].descFunc = function(){
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc('If activated, this veil will protect you from <b>%1</b>.', [decay.exhaustion?loc('your exhaustion'):loc('fatigue buildup')]) + '<br>' + loc('Price scales with highest raw CpS reached this ascension.') + '<q>Let fate be in your hands.</q>';
		} 
		Game.Upgrades['Shimmering veil [off]'].priceFunc = function() {
			return Game.getVeilCost(Game.veilPreviouslyCollapsed);
		}
		Game.Upgrades['Shimmering veil [off]'].buyFunction = function() {
			Game.veilPreviouslyCollapsed = false;
			Game.UpdateMenu();
			decay.times.sinceVeilTurnOn = 0;
			decay.onExhaustionRecovery();
		}
		Game.Upgrades['Shimmering veil [on]'].buyFunction = function() {
			if (decay.times.sinceGameLoad < 1) { return; }
			decay.times.sinceVeilTurnOff = 0;
			Game.veilHP -= decay.veilDecBase * 25; 
		}
		replaceDesc('Reinforced membrane', 'Increases the Shimmering veil\'s <b>maximum health</b> by <b>35%</b>.<q>A consistency between jellyfish and cling wrap.</q>');
		replaceDesc('Delicate touch', 'The Shimmering veil takes <b>30%</b> less time to recover from a collapse.<q>It breaks so easily.</q>');
		replaceDesc('Steadfast murmur', 'The Shimmering veil is <b>four times</b> cheaper.<q>Lend an ear and listen.</q>');
		replaceDesc('Glittering edge', 'The Shimmering Veil also decreases decay rates by <b>20%</b> when turned on.<q>Stare into it, and the cosmos will stare back.</q>');
		Game.Upgrades['Shimmering veil'].basePrice /= 1000;
		Game.Upgrades['Reinforced membrane'].basePrice /= 1000;
		Game.Upgrades['Delicate touch'].basePrice /= 100;
		Game.Upgrades['Steadfast murmur'].basePrice /= 100;
		Game.Upgrades['Glittering edge'].basePrice /= 100;
		var brokenVeil = new Game.Upgrade('Shimmering veil [broken]', '', 0, [9, 10]); brokenVeil.pool = ['toggle']; Game.UpgradesByPool['toggle'].push(brokenVeil); brokenVeil.order = 20005;
		Game.Upgrades['Shimmering veil [on]'].order = 20003;
		Game.Upgrades['Shimmering veil [off]'].order = 20004;
		addLoc('This Shimmering Veil has collapsed.');
		brokenVeil.descFunc = function() {
			return loc('This Shimmering Veil has collapsed.') + '<q>Let fate be in your hands.</q>';
		}
		addLoc('This Shimmering Veil will be restored in: ');
		brokenVeil.displayFuncWhenOwned = function() {
			return '<div style="text-align:center;">'+loc('This Shimmering Veil will be restored in: ')+'<br><b>'+Game.sayTime(Game.veilRestoreC,-1)+'</b></div>';
		}
		brokenVeil.timerDisplay = function() {
			if (!Game.Upgrades['Shimmering veil [broken]'].bought) { return -1; } else { return 1-Game.veilRestoreC/Game.getVeilCooldown(); }
		}
		Game.veilOn = function() {
			return (Game.Has('Shimmering veil [off]') && (!Game.Has('Shimmering veil [broken]')));
		}
		Game.veilOff = function() {
			return (Game.Has('Shimmering veil [on]') && (!Game.Has('Shimmering veil [broken]')));
		}
		Game.veilBroken = function() {
			return ((!Game.Has('Shimmering veil [off]')) && (!Game.Has('Shimmering veil [on]')));
		}
		eval('Game.Logic='+Game.Logic.toString().replace(`if (Game.Has('Shimmering veil') && !Game.Has('Shimmering veil [off]') && !Game.Has('Shimmering veil [on]'))`, `if (Game.Has('Shimmering veil') && !Game.veilOn() && !Game.veilOff() && !Game.veilBroken())`));
		eval('Game.DrawBackground='+Game.DrawBackground.toString().replace(`if (Game.Has('Shimmering veil [off]'))`, `if (Game.veilOn())`));
		decay.veilDecBase = 12;
		Game.updateVeil = function() {
			if (!Game.Has('Shimmering veil') || decay.times.sinceGameLoad < 5) { return false; }
			
			if (Game.veilHP < Game.veilCollapseAt) {
				//console.log(Game.veilHP);
				Game.veilHP = Game.veilCollapseAt;
				Game.collapseVeil(); 
			}

			if (Game.veilOn()) { 
				if (!decay.isConditional('veil') || decay.gen < 1) { 
					Game.veilHP -= decay.veilDecBase / Game.fps;
				} else {
					Game.veilHP += (Game.veilMaxHP - Game.veilHP) * (1 - Math.pow(1 - (0.02 / Game.fps), decay.gen));
				}
				return true;
			} 
			if (Game.veilOff()) {
				if (decay.isConditional('veil') && Game.TCount > 5 * Game.fps) { decay.forceAscend(false); }
				return true;
			}
			if (Game.veilBroken()) {
				Game.veilRestoreC--;
				if (Game.veilRestoreC <= 0) {
					Game.veilRestoreC = 0;
					Game.veilHP = Game.veilMaxHP;
					Game.Lock('Shimmering veil [broken]');
					Game.Unlock('Shimmering veil [off]');
					Game.Unlock('Shimmering veil [on]');
					const prev = decay.times.sinceVeilTurnOff;
					Game.Upgrades['Shimmering veil [on]'].earn();
					decay.times.sinceVeilTurnOff = prev;
					Game.Notify('Veil restored!', 'Your Shimmering Veil has recovered from the collapse!');
				}
				return true;
			}
		}
		Game.veilRestoreC = 0;
		Game.veilPreviouslyCollapsed = false;
		Game.collapseVeil = function(noSave) {
			if (Game.Has('Sparkling wonder') && Math.random() < 0.1 && !noSave) {
				Game.veilHP = Game.veilMaxHP;
				Game.Notify('Veil revived', 'Your Sparkling wonder saved your veil from collapse and healed it back to full health!', [23, 34]);
				Game.Win('Thick-skinned');
			} else {
				Game.Lock('Shimmering veil [on]');
				Game.Lock('Shimmering veil [off]');
				Game.Upgrades['Shimmering veil [broken]'].earn();
				Game.veilRestoreC = Game.getVeilCooldown();
				Game.veilPreviouslyCollapsed = true;
				decay.times.sinceVeilTurnOff = 0;
				//need to fix this at some point to make it actually reflect the amount of decay it absorbed
				//decay.amplifyAll(Math.pow(Game.veilMaxHP / Game.veilHP, Game.veilAbsorbFactor * Game.getVeilReturn()), 0, 1);
				Game.Notify('Veil collapse!', 'Your Shimmering Veil collapsed.', [30, 5]);
				PlaySound('snd/spellFail.mp3',1);
				if (decay.isConditional('veil')) { decay.forceAscend(false); }
			}
		}
		replaceAchievDesc('Thick-skinned', 'Have your <b>Sparkling wonder</b> save your <b>Shimmering veil</b> from collapsing.');
		Game.loseShimmeringVeil = function(c) { } //prevent veil from being lost from traditional methods
		//veil graphics down below
		Game.veilOpacity = function() {
			return Math.pow(Game.veilHP / Game.veilMaxHP, 0.35) * Math.min(decay.times.sinceVeilTurnOn / Game.fps / 2, 1);
		}
		Game.veilRevolveFactor = function(set) {
			return 0.01 * (1 + set * 0.6) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.05);
		}
		Game.veilParticleSizeMax = function(set) {
			return 64 * Math.pow(0.8, set) * Math.pow((Game.veilHP / Game.veilMaxHP), 0.05);
		}
		Game.veilParticleSpeed = function(set) {
			return 32 * Math.pow(1.4, set) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.05);
		}
		Game.veilParticleSpeedMax = function(set) {
			return 32 * (1 + set * 0.5);
		}
		Game.veilParticleQuantity = function(set) {
			return Math.round(9 * (set + 1));
		}
		Game.veilParticleOpacity = function(set) {
			return Math.min(decay.times.sinceVeilTurnOn / Game.fps / (set * 0.8 + 1), 1);
		}
		Game.veilParticleSpawnBound = function(set) {
			return 155 + set * 2;
		}
		Crumbs.objectBehaviors.veilMain.replace('this.scaleY = scale;', 'this.scaleY = scale; this.alpha = Game.veilOpacity();');
		Crumbs.h.rand01 = function(x) {
  			x = ((x >>> 16) ^ x) * 0x45d9f3b;
  			x = ((x >>> 16) ^ x) * 0x45d9f3b;
  			x = (x >>> 16) ^ x;
  			return (x >>> 0) / 0x100000000;
		}
		Crumbs.veilGlintGenerator = function(m, ctx) {
			if (!Game.prefs.particles || !Game.Has('Shimmering veil [off]')) { return; }
			const tt = Math.pow(Game.veilHP * 2 / Game.veilMaxHP, 0.5);
			Math.seedrandom(Game.seed);
			const mm = 69 + Math.floor(Math.random() * 100);
			Math.seedrandom();
			for (let set = 0; set < 4; set++) {
				if (!Game.prefs.fancy && set != 2) { continue; } 
				let rotationAmount = ((Game.T * (1 + set * 0.6)) % (20 * Game.fps)) / (20 * Game.fps) * Math.PI * 2;
				ctx.rotate(rotationAmount);
				ctx.globalAlpha = Game.veilParticleOpacity(set);
				const q = Game.veilParticleQuantity(set);
				const rf = Game.veilRevolveFactor(set);
				const sm = Game.veilParticleSizeMax(set);
				const sb = Game.veilParticleSpawnBound(set);
				const s = Game.veilParticleSpeed(set);
				for (let i = 0; i < q; i++) {
					const b = (tt >= 1) || (Crumbs.h.rand01(set * mm + i) < tt);

					let t = Game.T + i * Math.round((90 / q));
					let r = (t % Game.fps) / Game.fps;
					let a = (Math.floor(t / Game.fps) * Game.fps * 6 - i * Game.fps) * rf;
					let size = sm * (1 - Math.pow(r * 2 - 1, 2));
					let xx = Math.sin(a) * (sb - s * Math.cos(r));
					let yy = Math.cos(a) * (sb - s * Math.sin(r));
					ctx.drawImage(Pic(b ? 'glint.png' : kaizoCookies.images.decayGlint), xx - size / 2, yy - size / 2, size, size);
				}
				ctx.rotate(-rotationAmount);
			}
		}
		Crumbs.findObject('bigCookie').findChild('veilGlintGenerator').getComponent('canvasManipulator').function = Crumbs.veilGlintGenerator;
		decay.veilBackgroundGlintParticle = { 
			width: 1, 
			height: 1, 
			img: 'img/glint.png', 
			life: 2 * Game.fps,
			maxLife: 2 * Game.fps,
			curvePow: 0.5,
			globalCompositeOperation: 'lighter',
			behavior: function () { 
				const curve = Math.sin(this.life / (this.maxLife) * Math.PI);
				this.width = curve * this.size;
				this.height = curve * this.size;
				this.alpha = Math.pow(curve, this.curvePow);
			},
			init: function() {
				this.life = this.maxLife;
			},
			size: 50
		}
		Crumbs.spawn({
			scope: 'background',
			behaviors: new Crumbs.behaviorInstance(function() {
				if (!Game.veilOn() || !Game.prefs.fancy || Game.OnAscend) { return; }
				//if (Game.T % 2 != 0) { return; }

				decay.veilBackgroundGlintParticle.size = (Math.random() + 0.25) * 50;
				decay.veilBackgroundGlintParticle.maxLife = 2 * (Math.random() * 0.5 + 0.75) * Game.fps;
				Crumbs.spawnParticle(decay.veilBackgroundGlintParticle, Math.random() * this.scope.l.offsetWidth, Math.random() * this.scope.l.offsetHeight, Math.random() * Math.PI, 1, 'background');
			}),
			order: 0.5,
		});

		allValues('veil');

		//other nerfs and buffs down below (unrelated but dont know where else to put them)
		
		//Shimmers
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace("if (me.wrath>0) list.push('clot','multiply cookies','ruin cookies');","if (me.wrath>0) list.push('clot','ruin cookies');")//Removing lucky from the wrath cookie pool
			.replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) list.push('building special');","if (Game.BuildingsOwned>=10 && me.wrath==0 && Math.random()<0.25) list.push('building special');")//Removing bulding special from the wrath cookie pool
			.replace(`Math.random()<0.1 && (Math.random()<0.05 || !Game.hasBuff('Dragonflight'))`, `Math.random()<0.1 && !Game.hasBuff('Dragonflight')`).replace(`if (me.force!='') {this.chain=0;choice=me.force;me.force='';}`, `if (me.force!='' && !(me.force=='click frenzy' && Game.hasBuff('Dragonflight'))) {this.chain=0;choice=me.force;me.force='';} else if (me.force=='click frenzy' && Game.hasBuff('Dragonflight')) { if (choice=='click frenzy') { Game.shimmerTypes['golden'].popFunc(me); return; /*I suppose you can get extra bs or ef here but the chance is so obscenely low I wouldnt bet on it*/ } }`)
			.replace(`if (Game.canLumps() && Math.random()<0.0005) list.push('free sugar lump');`, `if (Game.canLumps() && Math.random()<0.0005) { list.push('free sugar lump'); } if (Math.random()<Game.auraMult('Dragonflight')) { for (let i = 0; i < Game.gcBuffCount(); i++) { if (Math.random()<0.25) { list.push('dragonflight'); } } }`)
			.replace('if ((me.wrath==0 && Math.random()<0.15) || Math.random()<0.05)', 'if ((me.wrath==0 && Math.random()<0.3) || Math.random()<0.1)')
			.replace(`if (Game.Has('Get lucky')) effectDurMod*=2;`, `if (Game.Has('Get lucky')) effectDurMod*=1.5;`)
		); //dragonflight rework
		eval('Game.shimmerTypes.golden.getMaxTime='+Game.shimmerTypes.golden.getMaxTime.toString().replace('15', '10')); 
		eval('Game.shimmerTypes.golden.getMinTime='+Game.shimmerTypes.golden.getMinTime.toString().replace('5', '3.5'));
		eval('Game.shimmerTypes.golden.getTimeMod='+Game.shimmerTypes.golden.getTimeMod.toString().replace('m/=2', 'm*=(1/1.5)').replace('m/=2', 'm*=(1/1.5)')); 
		replaceDesc('Lucky day', 'Golden cookies appear <b>50% more often</b> and stay <b>twice as long</b>.<br>Unlocks after clicking <b>1</b> naturally spawning golden cookie this ascension.<br>Note that while the effect is reduced, the base golden cookie spawn rate is increased to compensate.<q>Oh hey, a four-leaf penny!</q>');
		Game.Upgrades['Lucky day'].basePrice /= 100;
		replaceDesc('Serendipity', 'Golden cookies appear <b>50% more often</b> and stay <b>twice as long</b>.<br>Unlocks after clicking <b>3</b> naturally spawning golden cookies this ascension.<br>Note that while the effect is reduced, the base golden cookie spawn rate is increased to compensate.<q>What joy! Seven horseshoes!</q>');
		Game.Upgrades['Serendipity'].basePrice /= 100;
		replaceDesc('Get lucky', `Golden cookie effects last <b>50% longer</b>.<br>Unlocks after clicking <b>7</b> naturally spawning golden cookies this ascension.<q>You've been up all night, haven't you?</q>`)
		Game.Upgrades['Get lucky'].basePrice /= 100;

		//making buildings start with level 1
		decay.resetBuildingLevelMinimums = function() {
			for (let i in Game.Objects) {
				Game.Objects[i].level = Math.max(1, Game.Objects[i].level);
			}
			Game.Objects['Wizard tower'].level = Math.max(2, Game.Objects['Wizard tower'].level);
			Game.LoadMinigames();
		}
		decay.resetBuildingLevelMinimums();

		eval('Game.ClickCookie='+Game.ClickCookie.toString().replace(`Game.Win('Uncanny clicker');`, `{ Game.Win('Uncanny clicker'); /*decay.triggerNotif('autoclicker');*/ }`).replace('Game.particleAdd();', 'if (Math.random() < decay.symptomsFromFatigue()) { Game.particleAdd(); }'));

		Game.baseResearchTime = 5 * 60 * Game.fps;
		
		decay.customShortcuts = function() {
			if (Game.keys[16] && Game.keys[69]) Game.ExportSave();
		}
		
		Game.registerHook('logic',decay.customShortcuts);

		/*=====================================================================================
        Script writer
        =======================================================================================*/
		decay.validCodeChars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','arrowup', 'arrowdown', 'arrowleft', 'arrowright', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '(', ')', ' ', '#', '\'', '-'];
		decay.SWCodes = [];
		decay.SWCode = function(code, onActivation, obj) {
			//stands for script writer code
			if (obj) { 
				if (obj.req) { this.req = obj.req; }
				if (obj.spaceSensitive) { this.spaceSensitive = obj.spaceSensitive; }
			}
			if (Array.isArray(code)) { for (let i in code) { code[i] = code[i].toLowerCase(); } this.code = code; } else if (typeof code === 'function') { 
				this.code = code; 
			} else {
				code = code.toLowerCase();
				this.code = [];
				for (let i in code) {
					if (!(code[i] == ' ' && !this.spaceSensitive)) { this.code.push(code[i]); }
				} 
			}
			this.activate = onActivation;

			this.count = 0;
			this.timer = 0;
			this.content = [];
			this.stop = 0;
			decay.SWCodes.push(this);
		}
		decay.SWCode.prototype.check = function(event) {
			const keyPressed = event.key.toLowerCase();
			if (!keyPressed || (!this.spaceSensitive && keyPressed == ' ')) { return; }
			if (this.req && !this.req()) { return; }
			const char = ((typeof this.code == 'function')?this.code()[this.count]:this.code[this.count]);
		
			if (keyPressed === char) {
				this.count++;
		
				clearTimeout(this.timer);
		
				this.timer = setTimeout(function(me) {
					me.clear();
				}, 10000, this);
		
				if (this.count === this.code.length) {
					this.activate.call(this, this.content);
					this.clear();
				}
			} else if (char == '%') {
				const nextChar = ((typeof this.code == 'function')?this.code()[this.count+1]:this.code[this.count+1]);
				if (keyPressed == nextChar) { 
					this.count++; 
					this.stop++;
					this.check(event); 
				} else {
					if (!this.content[this.stop]) { this.content[this.stop] = []; }
					this.content[this.stop].push(keyPressed);
					if (!nextChar && this.content[0].length) { if (this.activate.call(this, this.content)) { this.clear(); } } //for case where % is at the very end
				}
			} else {
				this.clear();
			}
		}
		decay.SWCode.prototype.clear = function() {
			this.count = 0;
			this.stop = 0;
			clearTimeout(this.timer);
			this.content = [];
		}
		decay.checkSWCodes = function(event) {
			if (!decay.validCodeChars.includes(event.key.toLowerCase()) || Game.keys[17] || Game.OnAscend || !Game.Has('Script writer') || (event.shiftKey && (event.key.toLowerCase() == 'c' || event.key.toLowerCase() == 'p'))) { return; }
			if (decay.prefs.typingDisplay) { decay.previousContent.push(new decay.char(event.key.toLowerCase())); }
			for (let i in decay.SWCodes) {
				decay.SWCodes[i].check(event);
			}
		}
		decay.resetSW = function() {
			for (let i in decay.SWCodes) { decay.SWCodes[i].clear(); }
			for (let i in decay.previousContent) { decay.previousContent[i].t = 0; }
		}
		decay.wipeSW = function() {
			decay.SWCodes = [];
		}

		injectCSS('.typingDisplayContainer { position: absolute; z-index: 1000; left: 50%; bottom: 10%; transform: translate(-50%, 0%); padding: 5px; border-radius: 5px; pointer-events: none; background: rgba(0, 0, 0, 0.25); }');
		injectCSS('.character { display: inline-block; margin: 1px; font-size: 15px; }');
		decay.createTypingDisplay = function() {
			var div = document.createElement('div');
			div.classList.add('typingDisplayContainer');
			div.id = 'typingDisplayContainer';
			decay.typingDisplayL = div;
			l('game').appendChild(div);
		}
		decay.createTypingDisplay();
		decay.previousContent = []; //queue
		decay.char = function(content) { 
			this.c = content;
			this.mt = 5 * Game.fps;
			this.t = this.mt;
			this.l = null;

			this.createL();
		}
		decay.char.prototype.createL = function() {
			var div = document.createElement('span');
			div.classList.add('character');
			div.innerText = this.c;
			this.l = div;

			decay.typingDisplayL.appendChild(this.l);
		}
		decay.char.prototype.removeL = function() {
			this.l.remove();
		}
		decay.char.prototype.scale = function() {
			return Math.min(this.t / (this.mt - 4.5 * Game.fps), 1)*100;
		}
		decay.updateTypingDisplay = function() {
			if (!decay.previousContent.length) { decay.typingDisplayL.style.backgroundColor = 'rgba(0,0,0,0)'; } else { decay.typingDisplayL.style.backgroundColor = ''; }
			for (let i = 0; i < decay.previousContent.length; i++) {
				var me = decay.previousContent[i];
				me.t--;
				if (me.t<=0) { me.removeL(); decay.previousContent.shift(); i--; continue; }
				me.l.style.transform = 'scaleX('+me.scale()+'%)';
			}
		}
	
		decay.createDefaultSWCodes = function() {
			new decay.SWCode(["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"], function() { Game.Notify(`You thought something will happen, didn't you?`, ``, [7, 1, kaizoCookies.images.custImg], 10, 1); });
			addLoc('(repeating this code may yield different effects)');
			addLoc('How can I help you, sir?');
			new decay.SWCode('omaruvu', function() { Game.Notify(loc('How can I help you, sir?'), choose(decay.helpDesc) + '<br>' + loc('(repeating this code may yield different effects)'), [8, 1, kaizoCookies.images.custImg], 1000000000000000000000, 1); });
			new decay.SWCode('activatepartymode', function() { Game.PARTY = 1; });
			new decay.SWCode('opendebug', function() { Game.OpenSesame(); Game.Notify(`Debug tool activated!`,``, [10,6], 10, 1);});
			new decay.SWCode('limes', function() { window.open("https://cookieclicker.wiki.gg/wiki/Grimoire", "_blank"); });
			new decay.SWCode('summonreindeer', function() { var reindeer = new Game.shimmer('reindeer'); reindeer.noPurity = true; });
			new decay.SWCode('trufflz', function() { Game.registerHook('draw', () => {

						for (var i in Game.toys)
						{
							var ctx=Game.LeftBackground;
							var me=Game.toys[i];
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate(me.r);
					  
							Game.toys[i].icon=[22,4]
						
							if (Game.toysType==1) ctx.drawImage(Pic('icons.png'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
							ctx.restore();
						}
					});
					Game.TOYS=1;
					Game.Notify(`Trufflz:`, `I love the way they cook linguini.`, [16, 0, kaizoCookies.images.custImg], 10, 1);});
			new decay.SWCode('ihatethisgame', function() { Game.HardReset(1); });
			new decay.SWCode('idohatethisgame', function() { Game.HardReset(1); });
			new decay.SWCode('isurewouldloveifyoucanspawnagoldencookieandareindeeratthesametime', function() { var newShimmer=new Game.shimmer('a mistake'); decay.times.sinceSeason = 0; /* not really good coding design here but whatever*/ }, { req: function() { return (true || decay.times.sinceSeason >= 15 * 60 * Game.fps); }});
			new decay.SWCode('notify(%)', function(content) { var str = ''; for (let i in content[0]) { str += content[0][i]; } Game.Notify('Notified!', str); });

			addLoc('You are exhausted!');
			addLoc('Exhaustion not yet unlocked!');
			addLoc('Fatigue report');
			addLoc('You are %1% fatigued, and it would take you %2 clicks (%3 seconds with 10 clicks per second) to become exhausted.');
			new decay.SWCode('get fatigue', function() { if (decay.exhaustion) { Game.Notify(loc('You are exhausted!'), '', 0, 2); return; } if (Game.cookiesEarned < decay.featureUnlockThresholds.fatigue) { Game.Notify(loc('Exhaustion not yet unlocked!'), '', 0, 2); return; } decay.setWorkMult(); Game.Notify(loc('Fatigue report'), loc('You are %1% fatigued, and it would take you %2 clicks (%3 seconds with 10 clicks per second) to become exhausted.', [Beautify(decay.fatigue / decay.fatigueMax * 100, 1), Beautify((decay.fatigueMax - decay.fatigue) / (decay.clickWork * decay.workMult)), Beautify((decay.fatigueMax - decay.fatigue) / (decay.clickWork * decay.workMult) / 10, 1)]), 0); });
			decay.haltSWAlias = {
				//all the codes thats the same as the halt channel name is checked for somewhere else, this is just for alias
				'cookie': 'click',
				'soul': 'wSoul',
				'wrinklersoul': 'wSoul',
				'normalsoul': 'wSoul',
				'normalwrinklersoul': 'wSoul',
				'shiny': 'wSoulShiny',
				'golden': 'wSoulShiny',
				'wrinklershinysoul': 'wSoulShiny',
				'elderpledge': 'pledge',
				'orb': 'powerOrb',
				'powerorb': 'powerOrb',
				'powerclick': 'powerClick',
				'manifestspring': 'manifestSpring'
			}
			addLoc('Halt time report: %1'); addLoc('This halting method will fully run out in %1!'); addLoc('This channel is currently not active!'); addLoc('Halt group report: %1 (%2 active methods)'); addLoc('This halting group will all run out in %1.');
			new decay.SWCode('get halt %', function(content) {
				if (content.length > 20) { return true; }
				let str = content[0].join('');
				if (decay.haltSWAlias[str]) {
					str = decay.haltSWAlias[str];
				}
				if (!decay.halts[str]) { return false; }

				let channel = decay.halts[str];
				if ((channel.overtime == 0 && channel.halt == 0) || channel.channels?.length == 0) { 
					Game.Notify(loc('Halt time report: %1', channel.properName ?? str), loc('This channel is currently not active!'), 0, 6, true, true);
					return true;
				}

				if (channel.channels) {
					let str2 = '';
					let highest = 0;
					for (let i in channel.channels) {
						str2 += i + ': ' + decay.reportHaltTime(channel.channels[i]) + '<br>';
						highest = Math.max(highest, channel.channels[i].overtime + channel.channels[i].halt * (1 - channel.channels[i].overtimeDec));
					}
					str2 += loc('This halting group will all run out in %1.', Game.sayTime(highest / (decay.decHalt * Math.pow(Math.max(decay.rateTS / Math.pow(decay.acceleration, 0.75), 1), channel.channels[0].tickspeedPow) * channel.channels[0].decMult) * Game.fps));
					Game.Notify(loc('Halt group report: %1 (%2 active methods)', [channel.properName ?? str, channel.channels.length]), str2, 0, 20, true, true);
					return true;
				}

				Game.Notify(loc('Halt time report: %1', channel.properName ?? str), decay.reportHaltTime(channel), 0, 20, true, true);
				return true;
			});
			decay.reportHaltTime = function(channel) {
				let decRate = (decay.decHalt * Math.pow(Math.max(decay.rateTS / Math.pow(decay.acceleration, 0.75), 1), channel.tickspeedPow) * channel.decMult);
				return loc('This halting method will fully run out in %1!', [ 
					Game.sayTime((channel.overtime + channel.halt * (1 - channel.overtimeDec)) / decRate * Game.fps)
				]);
			}
			addLoc('To fully halt decay, you need at least %1 distinct halting methods. You currently have a functional %2 distinct halting methods, so the rate is decay is %3% of original.');
			new decay.SWCode('get halting requirements', function() { Game.Notify(loc('Halting requirements report'), loc('To fully halt decay, you need at least %1 distinct halting methods. You currently have a functional %2 distinct halting methods, so the rate is decay is %3% of original.', [Beautify(decay.getRequiredHalt(), 2), Beautify(decay.effectiveHalt, 2), Beautify((1 - decay.effectiveHalt / decay.getRequiredHalt()) * 100, 1)]), 0, 20, true, true); });
			addLoc('No wrinkler selected!');
			addLoc('This wrinkler currently has %1 health across all of its %2 layers, which would take a total of %3 clicks with the current %4 damage per click (%5); it %6, meaning that it would take %7 to reach the big cookie! %8');
			addLoc('due to it taking %1% more damage');
			addLoc('no wrinkler-specific damage multipliers');
			addLoc('has %1% movement speed'); addLoc('has no movement speed multipliers specific to this wrinkler');

			addLoc('HP: pops all %1 layers in %2 clicks (takes %3x damage, %4 at 10 clicks/second)');
			addLoc('Speed: %1%/s (%2 to reach)');
			addLoc('Stun: %1 (%2 left)'); addLoc('-%1% speed');
			new decay.SWCode('info', function() { 
				if (!decay.EOTWObj.targetWrinkler) { Game.Notify(loc('No wrinkler selected!')); return; }

				const w = decay.EOTWObj.targetWrinkler;
				let hp = 0;
				for (let i = 1; i < w.size; i++) {
					hp += decay.wrinklerHPFromSize(i) * decay.getWrinklerHPMult.call(w);
				}
				hp += w.hp;
				//%4 is damage multiplier which is currently unimplemented; %5 is movement multiplier, %8 is stun 
				Game.Notify(loc('Wrinkler report'),
				loc('HP: pops all %1 layers in %2 clicks (takes %3x damage, %4 at 10 clicks/second)', [Beautify(w.size), Beautify(Math.ceil(hp / (decay.wrinklerResistance * decay.getSpecialProtectMult(w)))), Beautify(w.damageMult, 2), Game.sayTime(Math.ceil(hp / (decay.wrinklerResistance * decay.getSpecialProtectMult(w))) / 10 * Game.fps)])+'<br>'+
				loc('Speed: %1%/s (%2 to reach)', [Beautify(w.speedMult * decay.wrinklerApproach * (w.bomber?2:1) * 100, 2), Game.sayTime(decay.EOTWObj.frames)])+'<br>'+
				loc('Stun: %1 (%2 left)', [(w.hurt>decay.wrinklerHurtNoEffectMinimum)?(loc('-%1% speed', Beautify(100 - 100 / Math.max((w.hurt - decay.wrinklerHurtNoEffectMinimum) / (Game.Has('Eternal light')?15:30), 1), 1))):loc('none'), (w.hurt>decay.wrinklerHurtNoEffectMinimum)?Game.sayTime((w.hurt - decay.wrinklerHurtNoEffectMinimum) / (decay.wrinklerHurtDecRate / (1 + decay.powerPokedStack)) * Game.fps):loc('none')])
				, 0, 6, true, true);
				/*Game.Notify(loc('Wrinkler report'), loc('This wrinkler currently has %1 health across all of its %2 layers, which would take a total of %3 clicks with the current %4 damage per click (%5); it %6, meaning that it would take %7 to reach the big cookie! %8', [
					Beautify(hp),
					Beautify(w.size),
					Beautify(Math.ceil(hp / (decay.wrinklerResistance * decay.getSpecialProtectMult(w)))),
					Beautify(decay.wrinklerResistance * decay.getSpecialProtectMult(w), 2),
					(decay.getSpecialProtectMult(w) != 1)?loc('due to it taking %1% damage', (decay.getSpecialProtectMult(w)>1)?('+' + Beautify((decay.getSpecialProtectMult(w) - 1) * 100, 0)):('-' + Beautify((1 - decay.getSpecialProtectMult(w)) * 100, 0))):loc('no wrinkler-specific damage multipliers'),
					(w.speedMult!=1)?loc('has %1% movement speed', (w.speedMult>1)?('+'+Beautify((w.speedMult - 1) * 100, 0)):(('-'+Beautify((1 - w.speedMult) * 100, 0)))):loc('has no movement speed multipliers specific to this wrinkler'),
					Game.sayTime(decay.EOTWObj.frames)
				]), 0, 6, true, true);*/
			});

			decay.ifCursed = function() { return decay.challengeStatus('typing'); }
			new decay.SWCode('cursedsliver', function() { Game.Notify(loc('You seek more power, huh?'), choose(decay.extraHelpDesc), [26, 7]); }, { req: decay.ifCursed });
			decay.extraHelpDesc = [
				'more codes coming soon...',
				'something straightforward: the sentence "cast incantation called nuke wizard towers leveling to repent for your mistakes" is not an orteil tooltip moment, and also refunds all lumps used to upgrade it!'
			];
			new decay.SWCode('castincantationcallednukewizardtowerslevelingtorepentforyourmistakes', function() { if (Game.Objects['Wizard tower'].level < 1) { return; } let lumpCount = (Game.Objects['Wizard tower'].level ** 2 - Game.Objects['Wizard tower'].level) / 2; Game.lumps += lumpCount; Game.Objects['Wizard tower'].level = 1; Game.Notify('Wizard tower level reset!', 'Your wizard tower levels have been successfully reset, and refunding <b>'+Beautify(lumpCount)+'</b> sugar lumps.', [17, 21]); }, { req: decay.ifCursed });

			for (let i in decay.scrolls) {
				if (!decay.SWCodes.includes(decay.scrolls[i].SWCodeObj)) { 
					decay.SWCodes.push(decay.scrolls[i].SWCodeObj);
				}
			}
		}
		decay.createDefaultSWCodes();

		decay.scrolls = {};
		decay.scrollsById = [];
		decay.scroll = function(name, desc, cost, icon, parents, posX, posY, code, cooldown, onActivation) {
			let upgrade = kaizoCookies.createHeavenlyUpgrade(name, desc, cost, icon, parents, posX, posY, 1000 + Object.keys(decay.scrolls).length * 0.01);
			this.name = name;
			this.onActivation = onActivation;
			this.upgrade = upgrade;
			kaizoCookies.achievements.push(upgrade);
			this.cooldownToSet = cooldown * Game.fps; //in seconds
			this.cooldown = 0;

			if (cooldown) { replaceDesc(name, desc.slice(0, desc.indexOf('<q>')==-1?desc.length:desc.indexOf('<q>')) + '<br>'+loc('Has a cooldown of <b>%1</b>.', Game.sayTime(cooldown * Game.fps, -1)), true); }

			this.SWCodeObj = new decay.SWCode(code, (function(context) { return function() { if (context.cooldown) { Game.Notify(loc('On cooldown! (%1 left)', Beautify(context.cooldown / Game.fps)+'s'), '', 0, 2); return; } if (!context.onActivation() && context.cooldownToSet) { context.setCooldown(); } } })(this), { req: (function(context) { return function() { return Game.Has(context.name); } })(this) });
			this.code = this.SWCodeObj.code;

			decay.scrolls[name] = this;
			this.id = decay.scrollsById.length;
			decay.scrollsById.push(this);
		}
		decay.scroll.prototype.setCooldown = function() {
			this.cooldown = this.cooldownToSet;

			if (l('scrollBox'+this.id)) { l('scrollBox'+this.id).remove(); }
			let div = document.createElement('div');
			div.classList.add('scrollCDBox');
			div.id = 'scrollBox' + this.id;
			div.innerHTML = decay.getScrollCDBoxInnerHTML.call(this);
			l('scrollCDs').appendChild(div);

			decay.hasScrollOnCooldown = true;
			if (decay.prefs.scrollCDDisplay) { l('scrollCooldownContainer').style.display = ''; }
		}
		decay.scroll.prototype.updateCooldownDisplay = function() {
			decay.scrollCDL.querySelector('#scrollBox'+this.id).getElementsByClassName('CDMeter')[0].getElementsByClassName('CDMeterFill')[0].style.width = (this.cooldown / this.cooldownToSet * 100) + '%';
		}
		decay.scroll.prototype.removeCooldownDisplay = function() {
			decay.scrollCDL.querySelector('#scrollBox'+this.id).remove();
		}
		decay.hasScrollOnCooldown = false;
		decay.checkHasScrollOnCooldown = function() {
			for (let i in decay.scrolls) {
				if (decay.scrolls[i].cooldown) {
					decay.hasScrollOnCooldown = true; 
					if (decay.prefs.scrollCDDisplay) { l('scrollCooldownContainer').style.display = ''; } else { l('scrollCooldownContainer').style.display = 'none'; }
					return;
				}
			}
			decay.hasScrollOnCooldown = false;
			l('scrollCooldownContainer').style.display = 'none';
		}
		addLoc('On cooldown! (%1 left)');
		addLoc('Scroll "%1" reloaded!');
		addLoc('Has a cooldown of <b>%1</b>.');
		decay.updateScrolls = function() {
			for (let i in decay.scrolls) {
				if (decay.scrolls[i].cooldown) {
					decay.scrolls[i].cooldown--; 
					if (Game.T % 2 == 0) { decay.scrolls[i].updateCooldownDisplay(); }
					if (!decay.scrolls[i].cooldown) {
						Game.Notify(loc('Scroll "%1" reloaded!', decay.scrolls[i].name), '', decay.scrolls[i].upgrade.icon, 10, true, true);
						decay.scrolls[i].removeCooldownDisplay()
						decay.checkHasScrollOnCooldown();
					}
				}
			}
		}
		Game.registerHook('logic', decay.updateScrolls);
		decay.saveScrolls = function() {
			let str = '';
			for (let i in decay.scrolls) {
				str += decay.scrolls[i].cooldown + ',';
			}
			return str.slice(0, str.length - 1);
		}
		decay.loadScrolls = function(str) {
			let arr = str.split(',');
			for (let i in arr) {
				if (isv(arr[i]) && parseFloat(arr[i])) { 
					decay.scrollsById[i].setCooldown(); 
					decay.scrollsById[i].cooldown = parseFloat(arr[i]); 
					decay.scrollsById[i].updateCooldownDisplay();
				}
			}
			decay.checkHasScrollOnCooldown();
		}
		decay.saveScrollExtras = function() {
			return '';
		}
		decay.loadScrollExtras = function(str) {

		}
		decay.resetScrolls = function() {
			for (let i in decay.scrolls) {
				decay.scrolls[i].cooldown = 0;
			}
			decay.prestigeEscalationScrollBoostCount = 0;
		}
		let scrollCDDiv = document.createElement('div');
		scrollCDDiv.id = 'scrollCooldownContainer';
		scrollCDDiv.style.display = 'none';
		decay.scrollCooldownContainerL = scrollCDDiv;
		injectCSS(`#scrollCooldownContainer { min-height: 24px; background:#999; background:url(img/darkNoise.jpg); width: 100%; box-shadow:0px 0px 4px #000 inset; position: relative; text-align: center; margin-bottom: 8px; }`);
		injectCSS(`#game.onMenu #scrollCooldownContainer { display: none; }`);
		injectCSS(`#scrollCDs { width: 100%; padding-bottom: 12px; vertical-align: middle; display: flex; justify-content: center; align-items: center; font-family: 'Merriweather', Georgia,serif; font-size: 12px; font-variant: small-caps; flex-wrap: wrap; }`)
		scrollCDDiv.innerHTML = `
		<div id="scrollCDs">
		
		</div>
		<div class="separatorBottom" style="position: absolute; bottom: -8px; z-index: 0;"></div>
		`; //hiding option in decay.prefs
		l('buildingsTitle').insertAdjacentElement('beforebegin', scrollCDDiv);
		decay.scrollCDL = l('scrollCDs');
		addLoc('<b>%1</b> left');
		decay.scrollCDTooltip = function(id) {
			return '<div style="width: '+(decay.scrollsById[id].cooldown>(3600 * Game.fps)?'300':'200')+'px; text-align: center;">'+'<div style="font-size: 80%; margin: 0px;">'+decay.scrollsById[id].name+'</div>'+loc('<b>%1</b> left', Game.sayTime(decay.scrollsById[id].cooldown, -1))+'</div>';
		}
		decay.getScrollCDBoxInnerHTML = function() {
			return `
			<div class="CDMeterTitle"><b>${this.name}</b></div>
			<div class="CDMeter" style="background: rgba(255, 255, 255, 0.1);" ${Game.getDynamicTooltip(`function() { return decay.scrollCDTooltip(${this.id}); }`, '', true)}>
				<div class="CDMeterFill" style="width: 100%;"></div>
				${tinyIcon(this.upgrade.icon, 'transform: scale(0.5) translate(0%, -85%);')}
			</div>
			`;
		}
		injectCSS(`.scrollCDBox { jusify-content: center; align-items: center; margin-left: 16px; margin-right: 16px; margin-top: 6px; margin-bottom: 6px; }`);
		injectCSS(`.CDMeterTitle { display: inline; margin: auto; line-height: 20px; text-shadow: 0px -1px 2px rgb(223, 255, 253, 0.5); }`);
		injectCSS(`.CDMeter { width: 120px; height: 24px; padding: 1px; border: 2px ridge white; border-radius: 4px; margin: auto; background: rgba(255, 255, 255, 0.1); box-shadow: 0px 0px 3px rgb(223, 255, 253); }`);
		injectCSS(`.CDMeterFill { background: rgb(232, 249, 255); height: 100%; }`);
		//since scrolls are also upgrades they are declared in the upgrades section
	
		decay.helpDesc = [
			'Typing "activatepartymode" will unlock party mode!', 
			'You know limes?', 
			'There is a code for summoning reindeer.', 
			//'Have you tried debug mode yet?', 
			'Do you hate this game?',
			'Someone must have told you how to get here.', 
			'Trufflz is the 9th best comp player.', 
			'You can spawn a hideous creature if you have met the conditions; 15 minutes needs to have passed, and you need to be on the Christmas season, then typing <br>"isurewouldloveifyoucanspawnagoldencookie<br>andareindeeratthesametime" will spawn it.', 
			'Not-historically, the garden of eden had at least one of every plant species in it.',
			'Do you know how much fatigue you have? With "get fatigue", now you know!',
			'There\'s "get halt click", or you can "get halt soul", or maybe "get halt shiny", so many options...',
			'Try "info" while hovering over a wrinkler.'
		];
		for (let i in decay.helpDesc) {
			addLoc(decay.helpDesc[i]);
			decay.helpDesc[i] = loc(decay.helpDesc[i]);
		}
		
		addEventListener("keydown", function(event) {
			if (kaizoCookies.paused && !decay.prefs.easyTyping) { return; }
			decay.checkSWCodes(event);
			if (decay.isConditional('rotated') && event.ctrlKey && event.keyCode == 65) { decay.forceAscend(false); }
			if ((decay.isConditional('typing') || decay.isConditional('typingR')) && event.key == 'Enter') { decay.resetSW(); }
		}, false);

		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
		.replace("(shortcut for import: ctrl+O)","(shortcut for export: shift+E) (shortcut for import: ctrl+O)")
		.replace("disabling may improve performance", "disabling may improve performance; not all changes may apply until a game restart")
		);

		addLoc('Wrinklers appear %1 times as fast for %2!');
        new Game.buffType('trick or treat', function(time, pow) {
			return {
				name:'Trick or treat',
				desc:loc("Wrinklers appear %1 times as fast for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
				icon:[19, 8],
				time:time * Game.fps,
				power:pow,
				aura:1
			};
		});

		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (me.wrath && Math.random()<0.1) list.push('cursed finger');","if (me.wrath && Math.random()<0.1) list.push('cursed finger'); if (me.wrath>0 && Math.random()<0.05 && Game.season=='halloween') list.push('trick or treat'); if (Math.random()<0.05 && Game.season=='valentines') list.push('lonely');"));

		decay.Surprise = 0;

		eval('Game.dropRateMult='+Game.dropRateMult.toString().replace("if (Game.Has('Santa\'s bottomless bag')) rate*=1.1;","if (Game.Has('Santa\'s bottomless bag')) rate*=1.1; if (decay.Surprise) rate*=1.1;"));
				
		var year=new Date().getFullYear();
		var leap=(((year%4==0)&&(year%100!=0))||(year%400==0))?1:0;
		var day=Math.floor((new Date()-new Date(year,0,0))/(1000*60*60*24));
		if (day >= 160 + leap && day < 161 + leap)  { decay.Surprise = 1; Game.Notify(`Suprise!`, `There is a rare creature called "reingold" that can only be found normally on this day, have fun hunting it!`, [22, 2, kaizoCookies.images.custImg],100,1); };

        addLoc("Reingold");

        Game.shimmerTypes["a mistake"] = { //what have i done
			reset: function () {
				this.hp = 0;
				this.last = '';
			},
			initFunc: function (me) {
				if (!this.spawned && Game.chimeType != 0 && Game.ascensionMode != 1) PlaySound('snd/jingle.mp3');
		
				me.spawnLead = 1 //all reingolds are nats (thanks cursed)
		
				me.x = -128;
				if (!Game.reingoldPosition) {
					Game.reingoldPosition = setInterval(function () { //reingold's position changes twice a second
						me.y = Math.floor(Math.random() * Math.max(0, Game.bounds.bottom - Game.bounds.top - 256) + Game.bounds.top + 128) - 128;
						me.x = Math.floor(Math.random() * Math.max(0, (Game.bounds.right - 300) - Game.bounds.left - 256) + Game.bounds.left + 128) - 128;
						if (!Game.reingoldPosition) { clearInterval(Game.reingoldPosition); Game.reingoldPosition = 0; return false; }
						//console.log("still running")
					}, 500);
				}
				me.l.style.width = '167px';
				me.l.style.height = '212px';
				if (true) me.l.style.backgroundImage = 'url(\'' + kaizoCookies.images.reingold + '\')'; //hehe
				//else me.l.style.backgroundImage = 'url(\'' + 'img/betterReinGold.png' + '\')';
				me.l.style.opacity = '0';
				me.l.style.display = 'block';
				me.l.setAttribute('alt', loc("Reingold"));
		
				me.life = 1;
				me.dur = 4;
		
				var dur = 4;
				if (Game.Has('Weighted sleighs')) dur *= 2;
				dur *= Game.eff('reindeerDur');
				if (this.hp > 0) dur = Math.max(2, 10 / this.hp);
				me.dur = dur;
				me.life = Math.ceil(Game.fps * me.dur);
				me.sizeMult = 1;
			},
			updateFunc: function (me) {
				var curve = 1 - Math.pow((me.life / (Game.fps * me.dur)) * 2 - 1, 4);
				me.l.style.opacity = curve;
				me.l.style.transform = 'translate(' + (me.x + (Game.bounds.right - Game.bounds.left) * (1 - me.life / (Game.fps * me.dur))) + 'px,' + (me.y - Math.abs(Math.sin(me.life * 0.1)) * 128) + 'px) rotate(' + (Math.sin(me.life * 0.2 + 0.3) * 10) + 'deg) scale(' + (me.sizeMult * (1 + Math.sin(me.id * 0.53) * 0.1)) + ')';
				me.life--;
				if (me.life <= 0) { this.missFunc(me); me.die(); }
			},
			popFunc: function (me) {
				//get achievs and stats
				Game.reindeerClicked++;
				Game.goldenClicks++;
				Game.goldenClicksLocal++;

				//select an effect
				var list = [];
				list.push('frenzy', 'multiply cookies');
				if (Math.random() < 0.1 && (Math.random() < 0.05 || !Game.hasBuff('Dragonflight'))) list.push('click frenzy');
		
				if (this.last != '' && Math.random() < 0.8 && list.indexOf(this.last) != -1) list.splice(list.indexOf(this.last), 1);//80% chance to force a different one
				var choice = choose(list);
		
				if (me.force != '') { this.hp = 0; choice = me.force; me.force = ''; }
		
				this.last = choice;
		
				//create buff for effect
				//buff duration multiplier
				var effectDurMod = 1;
				if (Game.Has('Get lucky')) effectDurMod *= 2;
				if (Game.Has('Lasting fortune')) effectDurMod *= 1.1;
				if (Game.Has('Lucky digit')) effectDurMod *= 1.01;
				if (Game.Has('Lucky number')) effectDurMod *= 1.01;
				if (Game.Has('Green yeast digestives')) effectDurMod *= 1.01;
				if (Game.Has('Lucky payout')) effectDurMod *= 1.01;
				effectDurMod *= 1 + Game.auraMult('Epoch Manipulator') * 0.05;
		
				if (Game.hasGod) {
					var godLvl = Game.hasGod('decadence');
					if (godLvl == 1) effectDurMod *= 1.07;
					else if (godLvl == 2) effectDurMod *= 1.05;
					else if (godLvl == 3) effectDurMod *= 1.02;
				}
		
				//effect multiplier (from lucky etc)
				var mult = 1;
				if (Game.Has('Green yeast digestives')) mult *= 1.01;
				if (Game.Has('Dragon fang')) mult *= 1.03;
				if (!me.wrath) mult *= Game.eff('goldenCookieGain');
				else mult *= Game.eff('wrathCookieGain');

				var popup = '';
				var buff = 0;

				if (choice == 'frenzy') {
					buff = Game.gainBuff('frenzy', Math.ceil(77 * effectDurMod), 7);
				}
				else if (choice == 'multiply cookies') {
					var val = Game.cookiesPs * 60;
					if (Game.hasBuff('Elder frenzy')) val *= 0.5;
					if (Game.hasBuff('Frenzy')) val *= 0.75;
					var moni = mult * Math.max(25, val);
					if (Game.Has('Ho ho ho-flavored frosting')) moni *= 2;
					moni *= Game.eff('reindeerGain');
					Game.Earn(moni);
		
					popup = '<div style="font-size:80%;">' + loc("+%1!", loc("%1 cookie", LBeautify(moni))) + '</div>';
				}
				else if (choice == 'click frenzy') {
					buff = Game.gainBuff('click frenzy', Math.ceil(13 * effectDurMod), 777);
				}
		
				decay.purifyFromShimmer(me);
		
				var cookie = '';
				var failRate = 0.8;
				if (Game.HasAchiev('Let it snow')) failRate = 0.6;
				failRate *= 1 / Game.dropRateMult();
				if (Game.Has('Starsnow')) failRate *= 0.95;
				if (Game.hasGod) {
					var godLvl = Game.hasGod('seasons');
					if (godLvl == 1) failRate *= 0.9;
					else if (godLvl == 2) failRate *= 0.95;
					else if (godLvl == 3) failRate *= 0.97;
				}
				if (Math.random() > failRate) {
					cookie = choose(['Christmas tree biscuits', 'Snowflake biscuits', 'Snowman biscuits', 'Holly biscuits', 'Candy cane biscuits', 'Bell biscuits', 'Present biscuits']);
					if (!Game.HasUnlocked(cookie) && !Game.Has(cookie)) {
						Game.Unlock(cookie);
					}
					else cookie = '';
				}
		
				if (popup == '' && buff && buff.name && buff.desc) popup = buff.dname + '<div style="font-size:65%;">' + buff.desc + '</div>';
				if (popup != '') Game.Popup(popup, me.x + me.l.offsetWidth / 2, me.y);
		
				Game.Notify(loc('You found %1!', choose(loc("Reindeer names"))), cookie == '' ? '' : '<br>You are rewarded with ' + Game.Upgrades[cookie].dname + '!', [12, 9], 6);
		
				this.hp += 0.35;
		
				if (Math.random() < this.hp) {
					this.hp = 0;
				}
		
				//console.log(this.hp)
		
				//sparkle and kill the shimmer
				Game.SparkleAt(Game.mouseX, Game.mouseY);
				PlaySound('snd/jingleClick.mp3');
				me.die();
				Game.reingoldPosition = 0;
			},
			missFunc: function (me) {
				if (this.hp > 0) {
					this.hp = 0;
				}
				Game.reingoldPosition = 0;
			},
			spawnsOnTimer: true,
			spawnConditions: function () {
				if (decay.Surprise == 1) return true; 
				else return false;
			},
			spawned: 0,
			time: 0,
			minTime: 0,
			maxTime: 0,
			getTimeMod: function (me, m) {
				if (Game.Has('Reindeer baking grounds')) m /= 2;
				if (Game.Has('Starsnow')) m *= 0.95;
				if (Game.hasGod) {
					var godLvl = Game.hasGod('seasons');
					if (godLvl == 1) m *= 0.9;
					else if (godLvl == 2) m *= 0.95;
					else if (godLvl == 3) m *= 0.97;
				}
				m *= 1 / Game.eff('reindeerFreq');
				if (Game.Has('Reindeer season')) m = 0.01;
				if (this.hp > 0) m = 0.0;
				return Math.ceil(Game.fps * 60 * m);
			},
			getMinTime: function (me) {
				var m = 4;
				return this.getTimeMod(me, m);
			},
			getMaxTime: function (me) {
				var m = 7;
				return this.getTimeMod(me, m);
			},
			last: ""
		};
		
		allValues('spells; decay complete');

		/*=====================================================================================
        Credits
        =======================================================================================*/
		addLoc('Kaizo cookies');
		addLoc('Kaizo cookies is a Cookie clicker content mod made by a few members of Dashnet Forums, featuring drastic changes that aims to make the game faster and more active. The mod is currently not complete, with content ending at the quattourdecillions range.');
		addLoc('Developing this mod took a lot of thought and effort over almost a year, culminating into one of the biggest cookie clicker content mod ever made, and we\'d really appreciate some support! Here\'s how:');
		addLoc('You can find a non-comprehensive changelog of the mod <a href="%1" target="_blank" class="highlightHover">here</a>, but we recommend against spoiling yourself with that information.');
		addLoc('join our <a href="%1" target="_blank" class="highlightHover smallWhiteButton">Discord server</a>! Any feedback is welcome!');
		addLoc('like, favorite, and (if you want) give an award to our steam workshop entry!');
		addLoc('share our mod with anyone who you think will like it!');
		injectCSS(`.subsection.kaizoCreditsBox { text-align: center; display: flex; flex-wrap: wrap; width: 90%; margin: 12px auto; border-radius: 5px; border:1px solid rgba(255,255,255,0.1); background: rgba(40, 40, 40, 0.05); box-shadow:0px 0px 3px rgb(75, 75, 75),0px 0px 1px #000 inset; }`);
		injectCSS(`.kaizoCreditsTitle { font-size:22px; width: 100%; flex: 1; display: block; text-align: center; margin-bottom:4px; margin-top: 0px; background:linear-gradient(to right,rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0.5),rgba(0,0,0,0),rgba(0,0,0,0)); padding:0px 16px; font-family: 'Merriweather', Georgia,serif; text-shadow:0px 1px 4px #000; color: #fff; }`);
		//injectCSS(`.kaizoCreditsTitle:after { content: "" !important, display: block; height: 1px; margin: 6px 0px; background:linear-gradient(to right,rgba(255,255,255,0),rgba(255,255,255,0),rgba(255,255,255,0.25),rgba(255,255,255,0),rgba(255,255,255,0)); }`);
		injectCSS(`.titleLine { height: 1px; width: 100%; margin: 6px 0px; background:linear-gradient(to right,rgba(255,255,255,0),rgba(255,255,255,0),rgba(255,255,255,0.25),rgba(255,255,255,0),rgba(255,255,255,0)); }`);
		injectCSS(`.KCPersonBox { padding: 8px; font-variant: small-caps; font-family: 'Merriweather', Georgia,serif;display: flex; border-radius: 3px; align-items: center; background: rgba(40, 40, 40, 0.05); border:1px solid rgba(255,255,255,0.1); box-shadow:0px 0px 2px rgb(30, 30, 30),0px 0px 1px #000 inset; font-size: 15px; margin: auto; text-shadow:0px -2px 6px rgba(255,255,200,0.6),0px 1px 0px rgba(100,100,100,1),0px 2px 4px rgba(0,0,0,1); }`);
		injectCSS(`.noteSpan { font-size: 9px; transform: translateY(3px); margin-left: 4px; }`);
		Game.updateLog= //declaring a new log text
		'<div class="section">'+loc("Kaizo cookies")+'</div>'+

		'<div class="selectable">'+
			'<div class="listing">'+loc('Kaizo cookies is a Cookie clicker content mod made by a few members of Dashnet Forums, featuring drastic changes that aims to make the game faster and more active. The mod is currently not complete, with content ending at the quattourdecillions range.')+'</div>'+
			'<div class="listing">'+loc('You can find a non-comprehensive changelog of the mod <a href="%1" target="_blank" class="highlightHover">here</a>, but we recommend against spoiling yourself with that information.', 'https://docs.google.com/document/d/1uicVSbhYwOjKJSPHEt7dpqKpriPGsWJeyZl1BVeltXA/edit?usp=sharing')+'</div>'+
			'<div class="listing block" style="margin:8px 32px;font-size:11px;line-height:110%;color:rgb(255, 200, 200);background:rgba(255, 179, 128, 0.15);">'+
				loc('Developing this mod took a lot of thought and effort over almost a year, culminating into one of the biggest cookie clicker content mod ever made, and we\'d really appreciate some support! Here\'s how:')+
				'<br><br>&bull; '+loc('join our <a href="%1" target="_blank" class="highlightHover smallWhiteButton">Discord server</a>! Any feedback is welcome!', 'https://discord.gg/pwhMxt5Ygw')+
				'<br><br>&bull; '+loc('like, favorite, and (if you want) give an award to our steam workshop entry')+' (mod for steam currently not released)'+ //insert link to entry here
				'<br><br>&bull; '+loc('share our mod with anyone who you think will like it!')+ //other monetization methods here; replace this bullet point
			'</div>'+
		'</div>'+

		'<div class="subsection kaizoCreditsBox">'+
			'<div class="kaizoCreditsTitle">Programmers</div>'+
			'<div class="titleLine"></div>'+
			'<div class="KCPersonBox" style="font-size: 20px; padding-left: 32px;">'+'<div style="display:inline-block;width:48px;height:48px;background:url(\''+kaizoCookies.images.cursed+'\');margin:-16px;transform:scale(0.6) translateX(-24px);"></div>'+'CursedSliver</div>'+
			'<div class="KCPersonBox" style="padding-left: 24px;">'+tinyIcon([8,1,kaizoCookies.images.custImg],"display: inline-block; transform: translateX(-12px) scale(0.6);")+'Omar uvu</div>'+
			'<div class="titleLine"></div>'+
			'<div class="KCPersonBox">Helloperson <span class="noteSpan">(buffTimerFix dev)</span></div>'+
			'<div class="KCPersonBox">xxfillex <span class="noteSpan">(P for Pause dev)</span></div>'+
			'<div class="KCPersonBox">yeetdragon <span class="noteSpan">(Crumbs engine helper)</span></div>'+
		'</div>'+

		'<div class="subsection kaizoCreditsBox">'+
			'<div class="kaizoCreditsTitle">Artists</div>'+
			'<div class="titleLine"></div>'+
			'<div class="KCPersonBox" style="font-size: 20px; padding-left: 32px;">'+tinyIcon([8,1,kaizoCookies.images.custImg],"display: inline-block; transform: translateX(-12px) scale(0.6);")+'Omar uvu</div>'+
			'<div class="KCPersonBox" style="padding-left: 24px;">'+'<div style="display:inline-block;width:48px;height:48px;background:url(\''+kaizoCookies.images.cursed+'\');margin:-16px;transform:scale(0.6) translateX(-24px);"></div>'+'CursedSliver</div>'+
			'<div class="titleLine"></div>'+
			'<div class="KCPersonBox">Whisp <span class="noteSpan">(helper)</span></div>'+
			'<div class="KCPersonBox">Samyli <span class="noteSpan">(helper)</span></div>'+
		'</div>'+

        '<div class="subsection kaizoCreditsBox">'+
			'<div class="kaizoCreditsTitle">Playtesters/QA</div>'+
			'<div class="titleLine"></div>'+
			'<div class="KCPersonBox">Hellranger</div>'+
			'<div class="KCPersonBox">Charlie</div>'+
		'</div>'+

		'<div class="subsection kaizoCreditsBox">'+
			'<div class="kaizoCreditsTitle">Special Thanks</div>'+
			'<div class="titleLine"></div>'+
			'<div class="KCPersonBox">Fififoop</div>'+
			'<div class="KCPersonBox">hz</div>'+
			'<div class="KCPersonBox">Lookas</div>'+
			'<div class="KCPersonBox">Dragoon</div>'+
			'<div class="titleLine"></div>'+
			'<div style="margin: 2px auto; font-variant: small-caps; font-family: \'Merriweather\', Georgia,serif; font-size: 13px; text-shadow:0px -2px 6px rgba(255,255,200,0.6),0px 1px 0px rgba(100,100,100,1),0px 2px 4px rgba(0,0,0,1); ">And of course, to everyone who gave us valuable advice and improvements!</div>'+
		'</div>'+

		'<div style="width: 100%; text-align: center; color: rgba(255, 255, 255, 0.01)">if only, if only... :heart:</div>'+ //fifi
		
		Game.updateLog; 
		
		/*=====================================================================================
        Minigames 
        =======================================================================================*/
		eval('Game.Object='+Game.Object.toString().replace(`me.level+1,loc("level up your %1",me.plural)`, `me.level,loc("level up your %1",me.plural)`).replace(`LBeautify(me.level+1)`, `LBeautify(me.level)`));
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].levelTooltip='+Game.Objects[i].levelTooltip.toString().replace(`LBeautify(me.level+1)`, `LBeautify(me.level)`).replace(`me.level+1?''`, `me.level?''`));
			Game.Objects[i].levelUp = function(me){
				return function(free){ if (decay.gameCan.levelUpBuildings) Game.spendLump(me.level,loc("level up your %1",me.plural),function()
				{
					me.level+=1;
					if (me.level>=10 && me.levelAchiev10) Game.Win(me.levelAchiev10.name);
					if (!free) PlaySound('snd/upgrade.mp3',0.6);
					Game.LoadMinigames();
					me.refresh();
					if (l('productLevel'+me.id)){var rect=l('productLevel'+me.id).getBounds();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24+32-TopBarOffset);}
					if (me.minigame && me.minigame.onLevel) me.minigame.onLevel(me.level);
				},free)();};
			}(Game.Objects[i]);
		}
		
        eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("if (Game.hasBuff('Crafty pixies')) price*=0.98;","if (Game.hasBuff('Crafty pixies')) price*=0.90;"))//Buffing the crafty pixies effect from 2% to 10%

		eval('Game.getLumpRefillMax='+Game.getLumpRefillMax.toString().replace('15', '6'));

		this.saveMinigames = function() {
			return this.saveGrimoire() + '#' + this.savePantheon() + '#' + '#';
		}
		this.grimoireSaveStr = '';
		this.pantheonSaveStr = '';
		this.loadMinigames = function(str) {
			let strs = str.split('#');

			if (isv(strs[0])) { this.grimoireSaveStr = strs[0]; }
			if (isv(strs[1])) { this.pantheonSaveStr = strs[1]; }

			if (grimoireUpdated) { this.loadGrimoire(this.grimoireSaveStr); } else { 
				const in1 = setInterval(function(t) { if (grimoireUpdated) { t.loadGrimoire(t.grimoireSaveStr); clearInterval(in1); } }, 10, this);
			}
			if (pantheonUpdated) { this.loadPantheon(this.pantheonSaveStr); } else {
				const in2 = setInterval(function(t) { if (pantheonUpdated) { t.loadPantheon(t.pantheonSaveStr); clearInterval(in2); } }, 10, this);
			}
		}
		this.wipeMinigames = function() {
			this.wipeGrimoire();
			this.wipePantheon();
		}

		decay.getCFChance = function() { 
			let chance = 1;
			if (decay.challengeStatus('combo1')) { chance += (Game.HasAchiev('A wizard is you')?0.5:0.25); }
			chance += decay.challengeStatus('allBuffStackR') * 0.02;
			if (decay.isConditional('dualcast') || decay.isConditional('comboOrbs')) { chance += 3; }

			return chance * Math.pow(0.6, Game.gcBuffCount()); 
		}
		decay.obliterateWrinkler = function(largest) {
			//RA method
			largest.sucked = 0;
			largest.size -= 10000;
			Game.wrinklerPopped++;
			let mirageObj = {};
			for (let i in largest) {
				if (i == 'behaviors' && i == 'components' && i == 't' && i == 'children') { continue; }
				mirageObj[i] = largest[i];
			}
			mirageObj.behaviors = new Crumbs.behaviorInstance(decay.holifyAbominationShrinkBehavior);
			mirageObj.anchor = 'center';
			//mirageObj.offsetY = Pic(mirageObj.imgs[mirageObj.imgUsing]).height * mirageObj.scaleY * 0.5;
			mirageObj.alpha = 1;
			mirageObj.id = 'wDisappearing';
			let displayChild = largest.findChild('wc');
			displayChild.anchor = 'center';
			displayChild.behaviors = [];
			displayChild.offsetY = Pic(displayChild.imgs[displayChild.imgUsing]).height * displayChild.scaleY * 0.5;
			displayChild.alpha = 1;
			mirageObj.children = [displayChild];
			//console.log(mirageObj);
			Crumbs.spawn(mirageObj);

			largest.die();
			//decay.wrinklerDeath.call(largest);
		}
		//SPELLS
		decay.seFrees = [];
		for (let i in Game.Objects) { decay.seFrees.push(0); }
		this.reworkGrimoire = function() {
			if (!Game.Objects['Wizard tower'].minigameLoaded || grimoireUpdated || l('grimoireInfo') === null) { return; } 
			
			gp = Game.Objects['Wizard tower'].minigame;
			Game.minigames.push(gp);
			if (typeof gp === 'undefined') { console.log('grimoire1 failed. gp: '+gp); return false; }
			if (l('grimoireInfo') === null) { console.log('grimoire2 failed. grimoireInfo:'+l('grimoireInfo')); return false; } 
			if (typeof gp.spells === 'undefined') { console.log('grimoire3 failed. gp.spells: '+gp.spells); return false; }
			var M = gp;
			//lump integration
			
			decay.addSpells();

			for (let i in M.spells) {
				M.spells[i].unlocked = false;
				M.spells[i].unlockPrice = 1;
			}
			M.spells['hand of fate'].unlockPrice = 5;
			M.updateLumpLocks = function() {
				for (let i in M.spells) { 
					if (M.spells[i].unlocked) {
						l('grimoireLumpLock'+M.spells[i].id).style.display = 'none';
					} else {
						l('grimoireLumpLock'+M.spells[i].id).style.display = '';
					}
				} 
			}
			addLoc('unlock <b>%1</b>');
			M.unlockSpell = function(spell) { 
				if (spell.unlocked) { return; }
				Game.spendLump(spell.unlockPrice, loc('unlock <b>%1</b>', spell.name), function() {
					spell.unlocked = true;
					M.updateLumpLocks();
				})(); 
			}
			M.spells['manifest spring'].unlocked = true;
			addLoc('<b>Cost to unlock:</b>');
			eval('M.spellTooltip='+M.spellTooltip.toString().replace(`<span class="red">'+me.failDesc+'</span>'):'')+'</div></div>';`, `<span class="red">'+me.failDesc+'</span>'):'')+'</div>'+
				(me.unlocked?'':('<div class="line"></div>'+loc('<b>Cost to unlock:</b>')+ '<span class="price lump'+(Game.lumps>=me.unlockPrice?'':' disabled')+'">'+Beautify(me.unlockPrice)+'</span>'))+
				'</div>';
			`));

			Game.rebuildGrimoire();

			M.updateLumpLocks();

			eval('gp.logic='+gp.logic.toString().replace('M.magicPS=Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.002;', 'M.magicPS = Math.min(1.5, decay.gen) * Game.eff(\'magicRegenSpeed\') * Math.max(0.003,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.003*(1 * Game.Has("Mana-enhanced magic"))*(decay.isConditional("dualcast")?2:1);'));
			eval('gp.logic='+replaceAll('M.','gp.',gp.logic.toString()));
			eval("gp.spells['spontaneous edifice'].win=" + Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win.toString().replace("{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<400) buildings.push(Game.Objects[i]);}", "{if (Game.Objects[i].amount>0 && decay.seFrees[Game.Objects[i].id] < 20) buildings.push(Game.Objects[i]);}").replace('building.buyFree(1);', 'decay.seFrees[building.id] += 5; building.getFree(5);'));
			gp.spells['spontaneous edifice'].fail = function() {
				for (let i in Game.Objects) {
					Game.Objects[i].sacrifice(1);
				}
				Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("One of every single one of your buildings disappear in a puff of smoke!")+'</div>',Game.mouseX,Game.mouseY);
			}
			eval('M.getFailChance='+M.getFailChance.toString().replace('var failChance=0.15;', 'if (decay.isConditional(\'dualcast\')) { return 0; } var failChance=0.15;'))
			addLoc('The spell picks a random building that you have at least 1 of, and gives you five of them for free that also doesn\'t affect its current price.');
			addLoc('Can give up to %1 free buildings for each building type.');
			addLoc('Lose one of every building.');
			addLoc('One of every single one of your buildings disappear in a puff of smoke!');
			gp.spells['spontaneous edifice'].desc = loc('The spell picks a random building that you have at least 1 of, and gives you five of them for free that also doesn\'t affect its current price.')+'<br>'+loc('Can give up to %1 free buildings for each building type.', Beautify(20));
			gp.spells['spontaneous edifice'].failDesc = loc("Lose one of every building.");
			addLoc('Spells cast: %1 (total: %2; cross-legacies total: %3)');
			decay.spellsCastTotalNGM = gp.spellsCastTotal;
			eval('gp.castSpell='+gp.castSpell.toString().replace('.spellsCastTotal++;', '.spellsCastTotal++; decay.spellsCastTotalNGM++;'));
			eval('gp.draw='+gp.draw.toString().replace(`Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/s",Beautify((M.magicPS||0)*Game.fps,2))+')'):'')`,
													 `Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/min",Beautify((M.magicPS||0)*Game.fps*60,3))+')'):'')`)
				.replace(`loc("Spells cast: %1 (total: %2)",[Beautify(M.spellsCast),Beautify(M.spellsCastTotal)]);`,
					 `loc(((decay.spellsCastTotalNGM==M.spellsCastTotal)?"Spells cast: %1 (total: %2)":"Spells cast: %1 (total: %2; cross-legacies total: %3)"),[Beautify(M.spellsCast),Beautify(M.spellsCastTotal),Beautify(decay.spellsCastTotalNGM)]); M.infoL.innerHTML+="; Magic regen multiplier from "+decay.term(decay.gen)+": "+decay.effectStrs([function(n, i) { return Math.min(1.5, n); }]); `));
			eval('gp.draw='+replaceAll('M.','gp.',gp.draw.toString()));		
			eval('gp.spells["hand of fate"].win='+gp.spells["hand of fate"].win.toString().replace(`if (Game.BuildingsOwned>=10 && Math.random()<0.4) choices.push('building special');`, 'if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push("building special"); decay.triggerNotif("fthof");').replace(`if (!Game.hasBuff('Dragonflight')) choices.push('click frenzy');`, '').replace(`if (Math.random()<0.15) choices=['cookie storm drop'];`, `if (Math.random()<decay.getCFChance()) choices=['click frenzy'];`));
			eval('gp.spells["hand of fate"].fail='+gp.spells["hand of fate"].fail.toString().replace(`if (Math.random()<0.1) choices.push('cursed finger','blood frenzy');`, `if (Math.random()<0.1) choices.push('cursed finger'); decay.triggerNotif("fthof");`));
			/*makes it so that the tooltips can support custom icons*/eval('gp.spellTooltip='+replaceAll('M.', 'gp.', gp.spellTooltip.toString()));
			eval('gp.spellTooltip='+gp.spellTooltip.toString().replace(`background-position:'+(-me.icon[0]*48)+'px '+(-me.icon[1]*48)+'px;`, `'+writeIcon(me.icon)+'`));
			addLoc('Summon a golden cookie with chance to yield Click frenzy. Each existing golden cookie makes this spell +%1% more likely to backfire.');
			addLoc('Each golden cookie buff active reduces the chance of clicking buffs.');
			gp.spells['hand of fate'].desc=loc("Summon a golden cookie with chance to yield Click frenzy. Each existing golden cookie makes this spell +%1% more likely to backfire.",15) + ' ' + loc('Each golden cookie buff active reduces the chance of clicking buffs.');
			addLoc('Obtaining this achievement also makes the second part of challenge reward <b>%1</b> twice as powerful.'); replaceAchievDesc('A wizard is you', loc('Cast <b>%1</b> spells.', 999) + '<div class="line"></div>' + loc('Obtaining this achievement also makes the second part of challenge reward <b>%1</b> twice as powerful.', decay.challenges.combo1.name) + '<q>I\'m a what?</q>');
			addLoc('Summons a power orb if there aren\'t any currently present, and continuously attracts every present power orb to your mouse for the next %1 seconds.');
			addLoc('Continuously heals and speeds up every present power orb for the next %1 seconds.');
			addLoc('Come, power orbs! Come!');
			addLoc('Better luck next time...');
			addLoc('Bending Power orbs to your will.');
			addLoc('Those Power orbs are quite a headache...');
			addLoc('Power clicks not yet unlocked!');
			gp.spells['haggler\'s charm'].desc = loc('Summons a power orb if there aren\'t any currently present, and continuously attracts every present power orb to your mouse for the next %1 seconds.', 20);
			gp.spells['haggler\'s charm'].failDesc = loc('Continuously heals and speeds up every present power orb for the next %1 seconds.', 30);
			gp.spells['haggler\'s charm'].costMin = 15;
			gp.spells['haggler\'s charm'].costPercent = 0.15;
			eval(`gp.spells["haggler's charm"].win=`+gp.spells['haggler\'s charm'].win.toString().replace('loc("Upgrades are cheaper!")', 'loc("Come, power orbs! Come!")').replace("('haggler luck',60,2);", '("haggler luck",20,2); if (decay.powerOrbsN <= 0 && Game.Has("Twin Gates of Transcendence")) { new decay.powerOrb(); } else { Game.Popup(\'<div style="font-size:80%;">\'+loc("Power clicks not yet unlocked!")+\'</div>\',Game.mouseX,Game.mouseY); return; }'));
			eval(`gp.spells["haggler's charm"].fail=`+gp.spells['haggler\'s charm'].fail.toString().replace('loc("Upgrades are pricier!")', 'loc("Better luck next time...")').replace('60*60,2);', '30,2);'));
			eval(`Game.buffTypesByName['haggler luck'].func=`+Game.buffTypesByName['haggler luck'].func.toString().replace(`loc("All upgrades are %1% cheaper for %2!",[pow,Game.sayTime(time*Game.fps,-1)])`, `loc("Bending Power orbs to your will.")`));
			eval(`Game.buffTypesByName['haggler misery'].func=`+Game.buffTypesByName['haggler misery'].func.toString().replace('loc("All upgrades are %1% pricier for %2!",[pow,Game.sayTime(time*Game.fps,-1)])', 'loc("Those Power orbs are quite a headache...")'));
			//CBG win effect
			eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace('Game.Earn(val);', "var buff = Game.gainBuff('haggler dream', 60, 1.75);"));
	        eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace(`Game.Popup('<div style="font-size:80%;">'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</div>',Game.mouseX,Game.mouseY);`, `Game.Popup('<div style="font-size:80%;">'+loc("Heavenly chips are stronger!")+'</div>',Game.mouseX,Game.mouseY);`));
	        eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace(`Game.Notify(loc("Conjure Baked Goods")+(EN?'!':''),loc("You magic <b>%1</b> out of thin air.",loc("%1 cookie",LBeautify(val))),[21,11],6);`, `Game.Notify(loc("Conjure Baked Goods")+(EN?'!':''),loc("Your heavenly chips are stronger.",loc("")),[21,11],6);`));
			//CBG fail effect
			eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].fail="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].fail.toString().replace(`var val=Math.min(Game.cookies*0.15,Game.cookiesPs*60*15)+13;`,`var val=Math.min(Game.cookies*0.5)+13;`).replace(`var buff=Game.gainBuff('clot',60*15,0.5);`, `var buff=Game.gainBuff('coagulated',1*60,0.5);`));
			//desc
			addLoc('+%1% prestige level effect for %2.');
			addLoc('Trigger a %1-minute coagulation and lose %2% of your cookies owned.');
			Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].desc=loc("+%1% prestige level effect for %2.", [75, Game.sayTime(60 * Game.fps)]);
			Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].failDesc=loc("Trigger a %1-minute coagulation and lose %2% of your cookies owned.", [1, 50]);
			addLoc('Holify Abomination');
			addLoc('Obliterate the biggest wrinkler without any negative effects or losing any cookies, and automatically stores its soul if possible.');
			addLoc('Summons a shiny wrinkler.');
			addLoc('Wrinkler obliteration in progress...');
			addLoc('But the shiny wrinkler couldn\'t fit.');
			addLoc('Beware of the beast!');
			gp.spells['resurrect abomination'].name = loc('Holify Abomination');
			gp.spells['resurrect abomination'].desc = loc('Obliterate the biggest wrinkler without any negative effects or losing any cookies, and automatically stores its soul if possible.');
			gp.spells['resurrect abomination'].failDesc = loc('Summons a shiny wrinkler.');
			decay.holifyAbominationShrinkBehavior = new Crumbs.behavior(function(p) {
				p.speed += p.acceleration;
				this.scaleX -= p.speed;
				this.scaleY -= p.speed;
				if (this.scaleX < 0 || this.scaleY < 0) { 
					if (decay.utenglobeStorage[(this.shiny?'shinySoul':'soul')].canDeposit()) { 
						decay.utenglobeStorage[(this.shiny?'shinySoul':'soul')].deposit(1); 
					} else {
						let soul = decay.spawnWrinklerSoul(this.x, this.y, this.shiny, 0.1, 0);
						for (let i in soul.behaviors) {
							if (soul.behaviors[i].dy) { soul.behaviors[i].dy = -4; break; }
						}
					}
					if (this.lumpCarrying) {
						Crumbs.spawn(decay.lumpToyCollectibleTemplate, { 
							type: this.lumpCarrying, 
							sy: (13 + this.lumpCarrying) * 48, 
							rotation: Math.random() * Math.PI * 2, 
							x: this.x, 
							y: this.y, 
							xd: (Math.max(Math.min(1000 / (this.x - this.scope.l.offsetWidth / 2), 400), -400) / 5)
						});
					}
					this.die(); 
				}
			}, { acceleration: 0.001, speed: 0 });
			gp.spells['resurrect abomination'].win = function() {
				Game.Popup('<div style="font-size:80%;">'+loc("Wrinkler obliteration in progress...")+'</div>',Game.mouseX,Game.mouseY);
				if (decay.wrinklersN == 0) { return; }
				let wrinklers = Crumbs.getObjects('w', 'left');
				let largest = wrinklers[0];
				const specialAttributes = ['shiny', 'leading', 'phantom', 'bomber', 'armored'];
				for (let i in wrinklers) {
					//rework this later perhaps, have the attributes each be worth some amount of sizes
					if (wrinklers[i].size > largest.size) { largest = wrinklers[i]; continue; }
					if (wrinklers[i].size >= largest.size) {
						for (let ii in specialAttributes) {
							if (wrinklers[i][specialAttributes[ii]] && !largest[specialAttributes[ii]]) { largest = wrinklers[i]; break; }
						}
					}
				}
				
				decay.obliterateWrinkler(largest);
			}
			gp.spells['resurrect abomination'].fail = function() {
				var r = decay.spawnWrinklerLead();
				r.shiny = true;
				if (r) {
					r.type = 1;
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("Beware of the beast!")+'</div>',Game.mouseX,Game.mouseY);
				} else {
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("But the shiny wrinkler couldn\'t fit.")+'</div>',Game.mouseX,Game.mouseY);
					return -1;
				}
			}
			gp.spells['resurrect abomination'].costMin = 6;
			gp.spells['resurrect abomination'].costPercent = 0.06;
			eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace(' && Game.elderWrath>0', ''));

			addLoc('The current ongoing challenge forbids you from using this spell!');
			eval('gp.spells["gambler\'s fever dream"].win='+gp.spells['gambler\'s fever dream'].win.toString()
				.replaceAll('M.', 'gp.').replace('var spells=[];', `if (decay.isConditional("dualcast")) { Game.Popup('<div style="font-size:80%;">'+loc("The current ongoing challenge forbids you from using this spell!")+'</div>',Game.mouseX,Game.mouseY); return -1; } var spells=[];`)
				.replace(`getSpellCost(Game.ObjectsById[7].minigame.spells[i])*0.5`, `getSpellCost(Game.ObjectsById[7].minigame.spells[i])*0.5 && Game.ObjectsById[7].minigame.spells[i].unlocked`)
			);
			
			addLoc('Summons a crafty pixie to predict good luck on your next cast, then refunds all magic used. Will guarantee success as long as the next cast casts a spell with the same backfire chance as this one, and that the next spell is casted in the same ascension.<br>A successful prediction cannot be changed without casting another spell or ascending.');
			addLoc('Uses up the magic spent without predicting anything.');
			addLoc('Great news! Next spell will not backfire!');
			addLoc('Summoning failed!');
			gp.spells['summon crafty pixies'].desc = loc('Summons a crafty pixie to predict good luck on your next cast, then refunds all magic used. Will guarantee success as long as the next cast casts a spell with the same backfire chance as this one, and that the next spell is casted in the same ascension.<br>A successful prediction cannot be changed without casting another spell or ascending.');
			gp.spells['summon crafty pixies'].failDesc = loc('Uses up the magic spent without predicting anything.');
			gp.spells['summon crafty pixies'].costMin = 15;
			gp.spells['summon crafty pixies'].costPercent = 0.05;
			gp.spells['summon crafty pixies'].win = function() { 
				Game.Popup('<div style="font-size:80%;">'+loc("Great news! Next spell will not backfire!")+'</div>',Game.mouseX,Game.mouseY);
				return -1;
			}
			gp.spells['summon crafty pixies'].fail = function() {
				Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("Summoning failed!")+'</div>',Game.mouseX,Game.mouseY);
			}

			for (let i in gp.spells) {
				Game.spellsProperNameToCode[gp.spells[i].name.toLowerCase()] = i;
			}
			eval('gp.castSpell='+gp.castSpell.toString()
				.replace('var obj=obj||{};', 'if (!decay.gameCan.castSpells || !spell.unlocked) { return; } var obj=obj||{};')
				.replace('M.magic-=cost;', 'M.magic-=cost; if (decay.covenantStatus("spellWorship") && pp && pp.swaps > 0) { pp.useSwap(1); }')
			);
			eval('gp.getSpellCost='+gp.getSpellCost.toString().replace('return', `if (decay.covenantStatus("spellWorship") && pp && pp.swaps > 0) { out *= 0.9; cost = Math.floor(out); } return`));
			
			this.loadGrimoire(this.grimoireSaveStr);

			if (Game.Has('Vial of challenges')) { M.spells['hand of fate'].unlocked = true; M.updateLumpLocks(); }

			grimoireUpdated = true; //no more unnecessary replacing 
			allValues('spells activated');
		};
		decay.addSpells = function() {
			addLoc('Liquify Politician');
			addLoc('Purifies a lot of decay with a very high purity limit, but the purity limit is halved for every golden cookie effect active.');
			addLoc('Amplifies your decay.');
			addLoc('Corruption cleared!');
			addLoc('Backfire! Corruption intensified!');
			addLoc('Manifest Spring');
			addLoc('Decay propagation is %1% slower for the next %2 minutes.<br>(this stacks with itself multiplicatively)');
			addLoc('Decay propagation is %1% faster for the next %2 minutes.');
			addLoc('The water shall flow!');
			addLoc('Oops! Pipes broken!');
			addLoc('Unending flow');
			addLoc('Halts decay for an especially long time. (each use is considered a distinct method)');
			addLoc('Stagnant body');
			addLoc('Decay propagation rate +%1% for %2!');
			gp.spells['liquify politician'] = {
				name: loc('Liquify Politician'),
				desc: loc('Purifies a lot of decay with a very high purity limit, but the purity limit is halved for every golden cookie effect active.'),
				failDesc: loc('Amplifies your decay.'),
				icon: [5, 0, kaizoCookies.images.custImg],
				costMin: 6,
				costPercent: 0.45,
				id: 9,
				win: function() {
					const prev = decay.pastCapPow;
					decay.pastCapPow = 0.4;
					decay.purifyAll(25, 0.25, 1 + 24 * Math.pow(0.5, Game.gcBuffCount()));
					decay.pastCapPow = prev;
					Game.Popup('<div style="font-size:80%;">'+loc("Corruption cleared!")+'</div>',Game.mouseX,Game.mouseY);
				},
				fail: function() {
					decay.amplifyAll(2, 0.5);
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire! Corruption intensified!")+'</div>',Game.mouseX,Game.mouseY);
				}
			}
			gp.spellsById.push(gp.spells['liquify politician']);
			decay.halts['manifestSpring'] = new decay.haltChannelGroup(loc('Manifest Spring'));
			decay.manifestSpringHaltParameters = {
				autoExpire: true,
				keep: 0,
				halt: 4,
				decMult: 0.05,
				power: 1
			}
			gp.spells['manifest spring'] = {
				name: loc('Manifest Spring'),
				desc: loc('Halts decay for an especially long time. (each use is considered a distinct method)'),
				failDesc: loc('Decay propagation is %1% faster for the next %2 minutes.', [50, 2]),
				icon: [6, 0, kaizoCookies.images.custImg],
				costMin: 18,
				costPercent: 0.25,
				id: 10,
				win: function() {
					let h = new decay.haltChannel(decay.manifestSpringHaltParameters);
					h.halt *= 1 + Game.log10Cookies / 30;
					if (decay.halts['manifestSpring'].length) { h.halt += decay.halts['manifestSpring'].channels[decay.halts['manifestSpring'].length - 1].halt; }
					decay.halts['manifestSpring'].addChannel(h);
					Game.Popup('<div style="font-size:80%;">'+loc("The water shall flow!")+'</div>',Game.mouseX,Game.mouseY);
				},
				fail: function() {
					Game.gainBuff('stagnant body', 120, 0.5);
					Game.Popup('<div style="font-size:80%;">'+loc("Oops! Pipes broken!")+'</div>',Game.mouseX,Game.mouseY);
				}
			}
			gp.spellsById.push(gp.spells['manifest spring']);
			
			
			new Game.buffType('unending flow', function(time, pow) {
			return {
					name: 'Unending flow',
					desc: loc('Decay propagation rate -%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
					icon: [6, 0, kaizoCookies.images.custImg],
					time: time*Game.fps,
					add: false,
					max: false,
					aura: 0
				}
			});
			
			new Game.buffType('stagnant body', function(time, pow) {
			return {
					name: 'Stagnant body',
					desc: loc('Decay propagation rate +%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
					icon: [30, 3],
					time: time*Game.fps,
					add: false,
					max: false,
					aura: 0
				}
			});
		}
		Game.rebuildGrimoire = function() {
			if (typeof gp === 'undefined') { return false; }
			let M = gp;
			var str='';
			str+='<style>'+
			'#grimoireBG{background:url('+Game.resPath+'img/shadedBorders.png),url('+Game.resPath+'img/BGgrimoire.jpg);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}'+
			'#grimoireContent{position:relative;box-sizing:border-box;padding:4px 24px;}'+
			'#grimoireBar{max-width:95%;margin:4px auto;height:16px;}'+
			'#grimoireBarFull{transform:scale(1,2);transform-origin:50% 0;height:50%;}'+
			'#grimoireBarText{transform:scale(1,0.8);width:100%;position:absolute;left:0px;top:0px;text-align:center;color:#fff;text-shadow:-1px 1px #000,0px 0px 4px #000,0px 0px 6px #000;margin-top:2px;}'+
			'#grimoireSpells{text-align:center;width:100%;padding:8px;box-sizing:border-box;}'+
			'.grimoireIcon{pointer-events:none;margin:2px 6px 0px 6px;width:48px;height:48px;opacity:0.8;position:relative;}'+
			'.grimoirePrice{pointer-events:none;}'+
			'.grimoireSpell{box-shadow:4px 4px 4px #000;cursor:pointer;position:relative;color:#f33;opacity:0.8;text-shadow:0px 0px 4px #000,0px 0px 6px #000;font-weight:bold;font-size:12px;display:inline-block;width:60px;height:74px;background:url('+Game.resPath+'img/spellBG.png);}'+
			'.grimoireSpell.ready{color:rgba(255,255,255,0.8);opacity:1;}'+
			'.grimoireSpell.ready:hover{color:#fff;}'+
			'.grimoireSpell:hover{box-shadow:6px 6px 6px 2px #000;z-index:1000000001;top:-1px;}'+
			'.grimoireSpell:active{top:1px;}'+
			'.grimoireSpell.ready .grimoireIcon{opacity:1;}'+
			'.grimoireSpell:hover{background-position:0px -74px;} .grimoireSpell:active{background-position:0px 74px;}'+
			'.grimoireSpell:nth-child(4n+1){background-position:-60px 0px;} .grimoireSpell:nth-child(4n+1):hover{background-position:-60px -74px;} .grimoireSpell:nth-child(4n+1):active{background-position:-60px 74px;}'+
			'.grimoireSpell:nth-child(4n+2){background-position:-120px 0px;} .grimoireSpell:nth-child(4n+2):hover{background-position:-120px -74px;} .grimoireSpell:nth-child(4n+2):active{background-position:-120px 74px;}'+
			'.grimoireSpell:nth-child(4n+3){background-position:-180px 0px;} .grimoireSpell:nth-child(4n+3):hover{background-position:-180px -74px;} .grimoireSpell:nth-child(4n+3):active{background-position:-180px 74px;}'+
			
			'.grimoireSpell:hover .grimoireIcon{top:-1px;}'+
			'.grimoireSpell.ready:hover .grimoireIcon{animation-name:bounce;animation-iteration-count:infinite;animation-duration:0.8s;}'+
			'.noFancy .grimoireSpell.ready:hover .grimoireIcon{animation:none;}'+

			'.grimoireLumpLock { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; z-index: 100; background: rgba(128, 0, 0, 0.2); }'+
			//'.grimoireLumpLock:after { content: \'asd\'; width: 48px; height: 48px; position: absolute; transform: translate(-25%, -25%) scale(0.5); top: 50%; left: 50%; background: url(imgs/icons.png); }'+
			
			'#grimoireInfo{text-align:center;font-size:11px;margin-top:12px;color:rgba(255,255,255,0.75);text-shadow:-1px 1px 0px #000;}'+
			'</style>';
			str+='<div id="grimoireBG"></div>';
			str+='<div id="grimoireContent">';
				str+='<div id="grimoireSpells">';//did you know adding class="shadowFilter" to this cancels the "z-index:1000000001" that displays the selected spell above the tooltip? stacking orders are silly https://philipwalton.com/articles/what-no-one-told-you-about-z-index/
				for (var i in M.spells)
				{
					var me=M.spells[i];
					var icon=me.icon||[28,12];
					str+='<div class="grimoireSpell titleFont" id="grimoireSpell'+me.id+'" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.spellTooltip('+me.id+')','this')+'><div class="usesIcon shadowFilter grimoireIcon" style="'+writeIcon(icon)+'"></div><div class="grimoirePrice" id="grimoirePrice'+me.id+'">-</div><div class="grimoireLumpLock" id="grimoireLumpLock'+me.id+'"><div class="usesIcon shadowFilter grimoireIcon" style="transform: translateY(8px); opacity: 0.9; '+writeIcon([29, 14])+'"></div></div></div>';
				}
				str+='</div>';
				var icon=[29,14];
				str+='<div id="grimoireBar" class="smallFramed meterContainer" style="width:1px;"><div '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.refillTooltip','this')+' id="grimoireLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-40px;top:-17px;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div><div id="grimoireBarFull" class="meter filling" style="width:1px;"></div><div id="grimoireBarText" class="titleFont"></div><div '+Game.getTooltip('<div style="padding:8px;width:300px;font-size:11px;text-align:center;">'+loc("This is your magic meter. Each spell costs magic to use.<div class=\"line\"></div>Your maximum amount of magic varies depending on your amount of <b>Wizard towers</b>, and their level.<div class=\"line\"></div>Magic refills over time. The lower your magic meter, the slower it refills.")+'</div>')+' style="position:absolute;left:0px;top:0px;right:0px;bottom:0px;"></div></div>';
				str+='<div id="grimoireInfo"></div>';
			str+='</div>';
			l('rowSpecial7').innerHTML=str;
			M.magicBarL=l('grimoireBar');
			M.magicBarFullL=l('grimoireBarFull');
			M.magicBarTextL=l('grimoireBarText');
			M.lumpRefill=l('grimoireLumpRefill');
			M.infoL=l('grimoireInfo');
			for (var i in M.spells)
			{
				var me=M.spells[i];
				AddEvent(l('grimoireSpell'+me.id),'click',function(spell){return function(){PlaySound('snd/tick.mp3');M.castSpell(spell);M.unlockSpell(spell)}}(me));
			}
			AddEvent(M.lumpRefill,'click',function(){
				if (M.magic<M.magicM)
				{Game.refillLump(1,function(){
					M.magic+=100;
					M.magic=Math.min(M.magic,M.magicM);
					PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
				});}
			});
		}
		this.saveGrimoire = function() {
			const M = Game.Objects['Wizard tower'].minigame;
			if (!M) { return ''; }
			let str = '';
			for (let i in M.spells) {
				str += (M.spells[i].unlocked?1:0) + ',';
			}
			return str.slice(0, str.length - 1);
		}
		this.loadGrimoire = function(str) {
			if (!isv(str)) { 
				const M = gp;
				if (Game.Has('Vial of challenges') && grimoireUpdated) { M.spells['hand of fate'].unlocked = true; M.updateLumpLocks(); }
				return; 
			}
			const M = gp;
			let strs = str.split(',');
			for (let i in M.spells) {
				if (isv(strs[M.spells[i].id])) { M.spells[i].unlocked = Boolean(parseInt(strs[M.spells[i].id])); }
			}
			if (Game.Has('Vial of challenges') && grimoireUpdated) { M.spells['hand of fate'].unlocked = true; }
			M.updateLumpLocks();
		}
		this.wipeGrimoire = function() {
			if (!grimoireUpdated) { return; }
			const M = gp;
			for (let i in M.spells) {
				M.spells[i].unlocked = false;
			}
			M.spells['manifest spring'].unlocked = true;
			M.updateLumpLocks();
		}

        //Garden changes
		this.reworkGarden = function() {
			if (!Game.Objects['Farm'].minigameLoaded || gardenUpdated) { return; }
			
		    const M = Game.Objects['Farm'].minigame; //Declaring M.soilsById so computeEffs works (this took hours to figure out)
			gap = M;
			Game.minigames.push(gap);
			if (l('gardenStats') === null) { return false; }
			M.soilsById.soilsById = [];
		    var n = 0;
		    for (var i in M.soils) {
		    	M.soils[i].id = n;
		    	M.soils[i].key = i;
		   		M.soilsById[n] = M.soils[i];
		        n++;
		    } 

			eval('M.clickTile='+M.clickTile.toString().replace(`//PlaySound('snd/tick.mp3');`, `if (kaizoCookies.paused) { M.buildPlot(); M.computeEffs(); }`))

			eval('M.logic='+M.logic.toString().replace('function()', 'function(force)').replace('if (now>=M.nextStep)', 'if (now>=M.nextStep || force)').replace('M.nextStep=now+M.stepT*1000;', 'if (!force) { M.nextStep=now+M.stepT*1000; }'));

		    M.harvestAll=function(type,mature,mortal)//Declaring harvestAll so M.convert works
		    {
			    var harvested=0;
			    for (var i=0;i<2;i++) {
				    for (var y=0;y<6;y++) {
					    for (var x=0;x<6;x++) {
						    if (M.plot[y][x][0]>=1) {
							    var doIt=true;
							    var tile=M.plot[y][x];
							    var me=M.plantsById[tile[0]-1];
							    if (type && me!=type) doIt=false;
							    if (mortal && me.immortal) doIt=false;
							    if (mature && tile[1]<me.mature) doIt=false;
							
							    if (doIt) harvested+=M.harvest(x,y)?1:0;
						    }
					    }
				    }
			    }
			    if (harvested>0) setTimeout(function(){PlaySound('snd/harvest1.mp3',1,0.2);},50);
			    if (harvested>2) setTimeout(function(){PlaySound('snd/harvest2.mp3',1,0.2);},150);
			    if (harvested>6) setTimeout(function(){PlaySound('snd/harvest3.mp3',1,0.2);},250);
		    }
			M.unlockProtectedSeeds = function() {
				M.unlockSeed(M.plants['bakerWheat']);
				if (decay.challengeStatus('combo4')) { M.unlockSeed(M.plants['thumbcorn']); }
				if (decay.challengeStatus('combo5')) { M.unlockSeed(M.plants['clover']); M.unlockSeed(M.plants['nursetulip']); }
			}

			addLoc("plants age <b>%1 times faster</b>");
			M.soils.dirt.tick = 1.5; M.soils.fertilizer.tick = 0.75; M.soils.clay.tick = 4; M.soils.pebbles.tick = 1.5; M.soils.woodchips.tick = 1.5;
			M.soils.dirt.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(1.5*60*Game.fps, -1)+'</b>')+'</div>';
			M.soils.fertilizer.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(0.75*60*Game.fps, -1)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-25%</b></div><div class="red">&bull; '+loc("weed growth")+' <b>+20%</b></div>';
			M.soils.clay.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(4*60*Game.fps, -1)+'</b>')+'</div><div class="green">&bull; '+loc("passive plant effects")+' <b>+25%</b></div>';
			M.soils.pebbles.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(1.5*60*Game.fps, -1)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-75%</b></div><div class="green">&bull; '+loc("plants age <b>%1 times faster</b>",3)+'</div><div class="green">&bull; '+loc("weed growth")+' <b>-90%</b></div>'; //pebbles secondary effect can stay because why not
			M.soils.woodchips.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(1.5*60*Game.fps), -1+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-75%</b></div><div class="green">&bull; '+loc("plants spread and mutate <b>%1 times more</b>",3)+'</div><div class="green">&bull; '+loc("weed growth")+' <b>-90%</b></div>';
			eval('M.logic='+M.logic.toString().replace(`tile[1]+=randomFloor((me.ageTick+me.ageTickR*Math.random())*M.plotBoost[y][x][0]*dragonBoost);`, `tile[1]+=randomFloor((me.ageTick+me.ageTickR*Math.random())*M.plotBoost[y][x][0]*dragonBoost*(M.soilsById[M.soil].key=='pebbles'?3:1));`));
			eval('M.getPlantDesc='+M.getPlantDesc.toString().replace('dragonBoost', '[FILLER]').replaceAll(`dragonBoost`, `(dragonBoost*(M.soilsById[M.soil].key=='pebbles'?(1/3):1))`).replace('[FILLER]', 'dragonBoost'));
			eval('M.tileTooltip='+M.tileTooltip.toString().replace('dragonBoost', '[FILLER]').replaceAll('dragonBoost', `(dragonBoost*(M.soilsById[M.soil].key=='pebbles'?(1/3):1))`).replace('[FILLER]', 'dragonBoost'));

			eval('M.clickTile='+M.clickTile.toString().replace('//if (M.freeze) return false;', 'if (!decay.gameCan.plant) { return false; }'));
			eval('M.isTileUnlocked='+M.isTileUnlocked.toString().replace('var level=M.parent.level;', 'var level=10;'));
			addLoc('Mature plants harvested: %1 (total: %2 (%3))');
			decay.harvestsTotalNGM = M.harvestsTotal;
			eval('gap.harvest='+M.harvest.toString().replace('.harvestsTotal++;', '.harvestsTotal++; decay.harvestsTotalNGM++;'));
			eval('M.draw='+M.draw.toString().replace('M.parent.level', '10').replace('M.parent.level', '10').replace(`l('gardenStats').innerHTML=loc("Mature plants harvested: %1 (total: %2)",[Beautify(M.harvests),Beautify(M.harvestsTotal)]);`, `l('gardenStats').innerHTML=loc((decay.harvestsTotalNGM==M.harvestsTotal?"Mature plants harvested: %1 (total: %2)":"Mature plants harvested: %1 (total: %2 (%3))"),[Beautify(M.harvests),Beautify(M.harvestsTotal),Beautify(decay.harvestsTotalNGM)]);`));
			M.selectedTile = [-1, -1];
			eval('M.buildPlot='+M.buildPlot.toString().replace(`if (plants>=6*6) Game.Win('In the garden of Eden (baby)');`, `M.checkGardenOfEden();`).replace(`'this')`, `'this').replace('.wobble();', '.wobble(); gap.selectedTile = ['+x+','+y+'];').replace('shouldHide=1;', 'shouldHide=1; gap.selectedTile = [-1, -1];')`).replace(`l('gardenPlot').innerHTML=str;`, `l('gardenPlot').innerHTML=str;`));
			M.checkGardenOfEden = function() {
				var plants = {};
				for (let i in M.plantsById) {
					plants[parseInt(i)+1] = false;
				}
				for (let i in M.plot) {
					for (let ii in M.plot[i]) {
						if (M.plot[i][ii][0]) {
							plants[M.plot[i][ii][0]] = true;
						}
					}
				}
				for (let i in plants) {
					if (!plants[i]) { return false; }
				}
				Game.Win('In the garden of Eden (baby)');
			}
			l('gardenPlot').innerHTML = ''; //nukes all plants, gotta get them back up somehow
			M.buildPlot();
			replaceAchievDesc('In the garden of Eden (baby)', 'Have at least <b>one</b> copy of every species of plant (of any growth stage) in your garden simultaneously, then let a tick pass.<q>Isn\'t tending to those precious little plants just so rock and/or roll?</q>');
			

			const chanceChanges=[[0.07, 0.12], [0.06, 0.11], [0.05, 0.1], [0.04, 0.08], [0.03, 0.06], [0.02, 0.04], [0.01, 0.03], [0.005, 0.2], [0.002, 0.01], [0.001, 0.008], [0.0007, 0.007], [0.0001, 0.002]];
			var changeStr = M.getMuts.toString();
			for (let i in chanceChanges) {
				changeStr = replaceAll(chanceChanges[i][0].toString(), chanceChanges[i][1].toString(), changeStr);
			}
			eval('M.getMuts='+changeStr);

			const ageChange = function(name, newTick, newTickR) {
				gap.plants[name].ageTick = newTick;
				gap.plants[name].ageTickR = newTickR;
			}
			ageChange('elderwort', 2, 2); ageChange('drowsyfern', 1, 1.5); ageChange('queenbeet', 2, 2); ageChange('bakeberry', 3, 1); ageChange('queenbeetLump', 0.25, 0.25);
			ageChange('duketater', 0, 2.5); ageChange('doughshroom', 2, 2.5); ageChange('tidygrass', 1, 2); ageChange('everdaisy', 1.75, 0); ageChange('nursetulip', 2, 4); ageChange('cronerice', 1.5, 3); ageChange('clover', 2, 3); ageChange('whiskerbloom', 4, 3); ageChange('wrinklegill', 4, 4);

			for (let i in M.plants) {
				M.plants[i].cost = 0;
				M.plants[i].costM = 0;
			}
			eval('M.seedTooltip='+M.seedTooltip.toString().replace('(me.plantable?', '(false?'));
			addLoc('Click to plant %1.');
			eval('M.tileTooltip='+M.tileTooltip.toString().replace(`loc("Click to plant %1 for %2.",['<b>'+me.name+'</b>','<span class="price'+(M.canPlant(me)?'':' disabled')+'">'+Beautify(Math.round(M.getCost(me)))+'</span>'])`, `loc("Click to plant %1.",'<b>'+me.name+'</b>')`));
			eval('M.getPlantDesc='+M.getPlantDesc.toString().replace(`if (it.unlocked)`, `if (true)`));

			eval('M.computeEffs='+M.computeEffs.toString()
				.replace("effs.cursorCps+=0.01*mult","effs.cursorCps+=0.005*mult")
				.replace("goldenClover') effs.goldenCookieFreq+=0.03*mult;","goldenClover') { effs.goldenCookieFreq+=0.03*mult; effs.goldenCookieEffDur*=1-0.03*mult; effs.goldenCookieGain+=0.0389*mult; }")
				.replace("else if (name=='whiskerbloom') effs.milk+=0.002*mult;","else if (name=='whiskerbloom') effs.milk+=0.001*mult;")
				.replace('buildingCost:1,', 'buildingCost:1, wrinklerApproach:1, wrathReplace:1, haltPower:1, decayRate:1, decayMomentum:1, magicRegenSpeed:1')
				.replace(`else if (name=='wardlichen') {effs.wrinklerSpawn*=1-0.15*mult;effs.wrathCookieFreq*=1-0.02*mult;}`, `else if (name=='wardlichen') {effs.haltPower+=0.02*mult; effs.wrathReplace*=1-0.02*mult;}`)
				.replace(`else if (name=='wrinklegill') {effs.wrinklerSpawn+=0.02*mult;effs.wrinklerEat+=0.01*mult;}`,`else if (name=='wrinklegill') {effs.wrinklerApproach*=1-0.02*mult;}`)
				.replace(`effs.wrathCookieGain+=0.01*mult;effs.wrathCookieFreq+=0.01*mult;`,`effs.wrinklerApproach*=1-0.01*mult; effs.haltPower+=0.01*mult;`)
				.replace(`effs.goldenCookieGain+=0.01*mult;effs.goldenCookieFreq+=0.01*mult;effs.itemDrops+=0.01*mult;`, `effs.decayRate *= 1 - 0.02*mult; effs.decayMomentum *= 1 - 0.02*mult;`)
				.replace(`effs.goldenCookieGain+=0.01*mult;effs.goldenCookieEffDur+=0.001*mult;`, `effs.goldenCookieGain+=0.05*mult;effs.goldenCookieEffDur+=0.001*mult;`)
				.replace(`'shriekbulb') {effs.cps*=1-0.02*mult;}`, `'shriekbulb') {effs.cps*=1-0.02*mult;} else if (name=='tidygrass') { effs.decayMomentum *= 1 - 0.05*mult; } else if (name=='everdaisy') { effs.decayRate *= 1 - 0.03*mult; }`)
				.replace(`effs.goldenCookieFreq+=0.01*mult;`, `{effs.goldenCookieFreq+=0.005*mult;effs.goldenCookieEffDur+=0.02*mult;}`)
				.replace(`effs.cps+=0.03*mult;effs.click*=1-0.05*mult;effs.goldenCookieFreq*=1-0.1*mult;`, `effs.magicRegenSpeed+=0.04*mult;effs.click*=1-0.05*mult;`)
			);
			decay.halts['bakeberry'] = new decay.haltChannel({
				keep: 3,
				decMult: 3,
				overtimeLimit: 1500,
				overtimeEfficiency: 0.1
			});
			M.plants['bakeberry'].onHarvest = function(x, y, age) {
				if (age < this.mature) { return; }

				decay.stop(4, 'bakeberry');
				Game.Popup('Decay halted!',Game.mouseX,Game.mouseY);
				M.dropUpgrade('Bakeberry cookies',0.015);
			}
			M.plants['queenbeet'].onHarvest = function(x, y, age) {
				if (age < this.mature) { return; }

				decay.purifyAll(1.1, 0.1, 5);
			}
			decay.halts['duketater'] = new decay.haltChannel({
				keep: 3,
				decMult: 3,
				overtimeLimit: 1500,
				overtimeEfficiency: 0.1
			});
			M.plants['duketater'].onHarvest = function(x, y, age) {
				if (age < this.mature) { return; }

				decay.stop(6, 'duketater');
				Game.Popup('Decay halted!',Game.mouseX,Game.mouseY);
				decay.purifyAll(1.15, 0.15, 5);
				M.dropUpgrade('Duketater cookies',0.01);
			}
			decay.halts['crumbspore'] = new decay.haltChannel({
				keep: 3,
				decMult: 3,
				overtimeLimit: 150,
				overtimeEfficiency: 0.1
			});
			M.plants['crumbspore'].onDie = function() {
				decay.stop(8, 'crumbspore');
				Game.Popup('Decay halted!<br>(Crumbspore)',Game.mouseX,Game.mouseY);
			}
			M.plants['doughshroom'].onDie = function() {
				decay.purifyAll(1.2, 0.2, 5);
			}
			M.plants['greenRot'].onHarvest = function(x, y, age) {
				if (age < this.mature || Game.shimmerTypes.golden.n) { return; }
				for (let i = 0; i < 1; i++) {
					let h = new Game.shimmer('golden', { type: 'reflective blessing', noWrath: true }, true);
					h.sizeMult = 0.6;
					h.dur = Math.ceil((Math.random()*6+12));
					h.life = Math.ceil(h.dur * Game.fps);
				}
				M.dropUpgrade('Green yeast digestives',0.005);
			}
			M.plants['chocoroot'].onHarvest = function(x, y, age) {
				if (age < this.mature) { return; }
				let allWrinklers = Crumbs.getObjects('w');
				for (let i in allWrinklers) {
					allWrinklers[i].dist += 0.015;
					if (allWrinklers[i] && !allWrinklers[i].dead) { decay.damageWrinkler.call(allWrinklers[i], 10 * decay.wrinklerResistance); }
				}
			}
			M.plants['whiteChocoroot'].onHarvest = function(x, y, age) {
				if (age < this.mature) { return; }
				if (decay.exhaustion) { decay.exhaustion = Math.max(decay.exhaustion - 3 * Game.fps, 1); }
			}
			decay.halts['jqb'] = new decay.haltChannel({
				properName: loc('Juicy queenbeet'),
				power: 12,
				keep: 0,
				factor: 0.9
			});
			M.plants['queenbeetLump'].onHarvest = function() {
				if (age < this.mature) { return; }
				decay.stop(6, 'jqb');
				decay.purifyAll(1, 1, 1);
			}
			addLoc('all decay-halting sources\' effect');
			addLoc('wrath cookies replacement');
			addLoc('wrinklers approach speed');
			addLoc('decay-halting power');
			addLoc('decay rates');
			addLoc('decay momentum');
			addLoc('decay propagation');
			addLoc('harvest when mature to temporarily halt decay');
			addLoc('harvest when mature to purify decay');
			addLoc('explodes and temporarily halts decay at the end of its lifecycle');
			addLoc('explodes and purifies decay at the end of its lifecycle');
			addLoc('if there are no golden cookies onscreen, summons a reflective blessing on mature harvest');
			addLoc('harvest when mature to damage and knock back all wrinklers');
			addLoc('harvest when mature to recover %1 worth of exhaustion');
			addLoc('magic regeneration speed');
			addLoc('harvest when mature to completely stop decay for a maximum of %1');
			addLoc('harvest when mature to purify all decay');
			M.plants['wardlichen'].effsStr = '<div class="green">&bull; ' + loc("all decay-halting sources' effect") + ' +2%</div><div class="gray">&bull; ' + loc("wrath cookies replacement") + ' -2%</div>';
			M.plants['wrinklegill'].effsStr = '<div class="green">&bull; ' + loc("wrinklers approach speed") + ' -2%</div>';
			M.plants['elderwort'].effsStr = '<div class="green">&bull; ' + loc("wrinklers approach speed") + ' -1%</div><div class="green">&bull; ' + loc("all decay-halting source' effect") + ' +1%</div><div class="green">&bull; ' + loc("%1 CpS", Game.Objects['Grandma'].single) + ' +1%</div><div class="green">&bull; ' + loc("immortal") + '</div><div class="gray">&bull; ' + loc("surrounding plants (%1x%1) age %2% faster", [3, 3]) + '</div>';
			M.plants['shimmerlily'].effsStr = '<div class="green">&bull; ' + loc('decay propagation') + ' -2%</div>';
			M.plants['gildmillet'].effsStr = '<div class="green">&bull; ' + loc("golden cookie gains") + ' +5%</div><div class="green">&bull; ' + loc("golden cookie effect duration") + ' +0.1%</div>';
			M.plants['tidygrass'].effsStr = '<div class="green">&bull; ' + loc("surrounding tiles (%1x%1) develop no weeds or fungus", 5) + '</div><div class="green">&bull; ' + loc('decay momentum') + ' -5%</div>';
			M.plants['everdaisy'].effsStr = '<div class="green">&bull; ' + loc("surrounding tiles (%1x%1) develop no weeds or fungus", 3) + '</div><div class="green">&bull; ' + loc("decay rates") + ' -3%</div><div class="green">&bull; ' + loc('immortal') + '</div>';
			M.plants['whiteChocoroot'].effsStr = '<div class="green">&bull; ' + loc("golden cookie gains") + ' +188%</div><div class="green">&bull; ' + loc("harvest when mature for +%1 of CpS (max. %2% of bank)", [Game.sayTime(3 * 60 * Game.fps), 3]) + '</div><div class="green">&bull; ' + loc("predictable growth") + '</div>';
			M.plants['whiskerbloom'].effsStr = '<div class="green">&bull;' + loc("milk effects") + ' +0.05%</div>';
			M.plants['glovemorel'].effsStr = '<div class="green">&bull;' + loc("cookies/click") + ' +4%</div><div class="green">&bull; ' + loc("%1 CpS", Game.Objects['Cursor'].single) + ' +0.5%</div><div class="red">&bull; ' + loc("CpS") + ' -1%</div>';
			M.plants['goldenClover'].effsStr = '<div class="green">&bull; ' + loc("golden cookie frequency") + ' +3%</div><div class="green">&bull; ' + loc("golden cookie gains") + ' +3.89%</div><div class="red">&bull; ' + loc('golden cookie effect duration') + ' -3%</div>';
			M.plants['clover'].effsStr = '<div class="green">&bull; '+loc("golden cookie frequency")+' +0.5%</div>' + '<div class="green">&bull; '+loc("golden cookie effect duration")+' +2%</div>';
			M.plants['bakeberry'].effsStr = '<div class="green">&bull; '+loc("CpS")+' +1%</div><div class="green">&bull; '+loc("harvest when mature to temporarily halt decay")+'</div>'; //hellrangers idea
			M.plants['queenbeet'].effsStr = '<div class="green">&bull; '+loc("golden cookie effect duration")+' +0.3%</div><div class="red">&bull; '+loc("CpS")+' -2%</div><div class="green">&bull; '+loc("harvest when mature to purify decay")+'</div>'; //also hellrangers idea
			M.plants['duketater'].effsStr = '<div class="green">&bull; '+loc('harvest when mature to temporarily halt decay')+'</div><div class="green">&bull; '+loc('harvest when mature to purify decay')+'</div>'; //also hellrangers idea
			M.plants['crumbspore'].effsStr = '<div class="green">&bull; '+loc("explodes and temporarily halts decay at the end of its lifecycle")+'</div><div class="red">&bull; '+loc("may overtake nearby plants")+'</div>';
			M.plants['doughshroom'].effsStr = '<div class="green">&bull; '+loc("explodes and purifies decay at the end of its lifecycle")+'</div><div class="red">&bull; '+loc("may overtake nearby plants")+'</div>';
			M.plants['greenRot'].effsStr = '<div class="green">&bull; '+loc("golden cookie duration")+' +0.5%</div><div class="green">&bull; '+loc("golden cookie frequency")+' +1%</div><div class="green">&bull; '+loc("if there are no golden cookies onscreen, summons a reflective blessing on mature harvest")+'</div>'; //ig the random drop increase can be left in as an easter egg
			M.plants['chocoroot'].effsStr = '<div class="green">&bull; '+loc("CpS")+' +1%</div><div class="green">&bull; '+loc("harvest when mature to damage and knock back all wrinklers")+'</div><div class="green">&bull; '+loc("predictable growth")+'</div>';
			M.plants['whiteChocoroot'].effsStr = '<div class="green">&bull; '+loc("golden cookie gains")+' +1%</div><div class="green">&bull; '+loc("harvest when mature to recover %1 worth of exhaustion",[Game.sayTime(3*Game.fps)])+'</div><div class="green">&bull; '+loc("predictable growth")+'</div>';
			M.plants['drowsyfern'].effsStr = '<div class="green">&bull; '+loc('magic regeneration speed')+' +4%</div><div class="red">&bull; '+loc('cookies/click')+' -5%</div>';
			M.plants['queenbeetLump'].effsStr = '<div class="red">&bull; '+loc("CpS")+' -10%</div><div class="red">&bull; '+loc("surrounding plants (%1x%1) are %2% less efficient",[3,20])+'</div><div class="green">&bull; '+loc('harvest when mature to completely stop decay for a maximum of %1', Game.sayTime(6 * Game.fps))+'</div><div class="green">&bull; '+loc('harvest when mature to purify all decay')+'</div>';
			eval("M.tools['info'].descFunc="+M.tools['info'].descFunc.toString().replace(`buildingCost:{n:'building costs',rev:true},`, `buildingCost:{n:'building costs',rev:true}, wrinklerApproach:{n:'wrinklers approach speed',rev:true}, wrathReplace:{n:'wrath cookies replacement',rev:true}, haltPower:{n:'decay-halting power'}, decayRate:{n:'decay rates',rev:true}, decayMomentum:{n:'decay momentum',rev:true}, magicRegenSpeed:{n:'magic regeneration speed'}`));

			eval("M.convert="+M.convert.toString().replace("Game.gainLumps(10);","Game.gainLumps(50);").replace(`M.unlockSeed(M.plants['bakerWheat']);`, `M.unlockProtectedSeeds();`));

			M.forceMuts = false;
			//I absolutely hate modifying event listeners that orteil made
			l('gardenLumpRefill').remove();
			//eval('Game.refillLump='+Game.refillLump.toString().replace('func();', 'func(); if (gap.loopsMult == 3) { gap.forceMuts = true; }'));

			addLoc('Click to open the garden augmentation menu.');
			addLoc('%1 cooldown after triggering an augment');
			M.refillTooltip = function() {
				return '<div style="padding:4px;width:300px;font-size:11px;text-align:center;" id="tooltipRefill">'+loc("Click to open the garden augmentation menu.")+(Game.canRefillLump()?'<br><small>('+loc("%1 cooldown after triggering an augment",Game.sayTime(Game.getLumpRefillMax()*(decay.isConditional('speedsac')?(1/3):1),-1))+')</small>':('<br><small class="red">('+loc("usable again in %1",Game.sayTime(Game.getLumpRefillRemaining()+Game.fps,-1))+')</small>'))+'</div>';
			}
			l('gardenNextTick').insertAdjacentHTML('beforeBegin', '<div '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.refillTooltip','this')+'id="gardenLumpAugmentSelect" class="usesIcon shadowFilter lumpRefill" style="display: block; left: -8px; top: -6px; background-image: url(' + kaizoCookies.images.custImg + '); background-position: ' + (-25 * 48) + 'px ' + (-2 * 48) + 'px;"></div>');
			M.lumpAugmentSelect=l('gardenLumpAugmentSelect');
			Crumbs.h.injectCSS('.augmentBox { padding: 8px; }'); //using Crumbs inject in order to allow it to resolve whenever we needs to
			Crumbs.h.injectCSS('.augmentBox:hover { background: #4b4b40; }'); 
			Crumbs.h.injectCSS('.augmentBox:active { background:#e3dfd0; }')
			addLoc('Trigger augment');
			AddEvent(M.lumpAugmentSelect,'click',function(){
				if (Game.lumpRefill) { return; }
				let strr = '<div class="line"></div><div class="block">' + loc('Triggering any augment automatically refills your soil timer; however, they have a shared cooldown of %1 on use.', Game.sayTime(Game.getLumpRefillMax()*(decay.isConditional('speedsac')?(1/3):1),-1)) + '</div><br>';
				for (let i in decay.gardenAugments) {
					if (!decay.gardenAugments[i].enabled) { continue; }
					strr += '<div class="block augmentBox" style="" ' + Game.clickStr + '="const M = gap; M.nextSoil=Date.now(); Game.refillLump('+decay.gardenAugments[i].cost+', function() { decay.gardenAugments[\''+i+'\'].func(); Game.ClosePrompt(); PlaySound(\'snd/pop\'+Math.floor(Math.random()*3+1)+\'.mp3\',0.75); }); Game.lumpRefill=Game.getLumpRefillMax()*(decay.isConditional(\'speedsac\')?(1/3):1);"><div style="display: inline-block; text-align: left; width: 70%;">' + decay.gardenAugments[i].text + '</div><div style="display: inline-block; text-align: right; width: 30%; font-size: 24px;"><div class="usesIcon shadowFilter" style="width: 48px; height: 48px; display: inline-block; transform: scale(0.6); margin: -12px; margin-bottom: -16px; margin-right: -8px; background-position:'+(-29*48)+'px '+(-14*48)+'px;"></div><span class="'+(Game.lumps >= decay.gardenAugments[i].cost?'':'disabled')+'" style="font-weight:bold;color:#6f6;">'+Beautify(decay.gardenAugments[i].cost)+'</span></div></div>';
					strr += '<div class="line"></div>';
				}
				Game.Prompt('<h3>'+loc("Trigger augment")+'</h3>'+strr, [[loc('Close'),'Game.ClosePrompt();']], 0, 'widePrompt');
			});
			addLoc('Triggering any augment automatically refills your soil timer; however, they have a shared cooldown of %1 on use.');
			addLoc('Click to trigger <b>%1</b> plant growth tick with <b>x%2</b> spread and mutation rate.');
			addLoc('Click to trigger <b>%1</b> plant growth ticks at once with <b>x%2</b> spread and mutation rate.');
			addLoc('Click to trigger <b>1</b> plant growth tick with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation.');
			decay.gardenAugments = {
				mutsMult: {
					text: loc('Click to trigger <b>%1</b> plant growth tick with <b>x%2</b> spread and mutation rate.', [1, 8]),
					cost: 1,
					enabled: true,
					func: function() {
						M.loopsMult=8;
						M.nextStep=Date.now();
					}
				},
				growthMinus: {
					text: loc('Click to trigger <b>%1</b> plant growth ticks at once with <b>x%2</b> spread and mutation rate.', [4, 0.4]),
					cost: 1,
					enabled: false,
					func: function() {
						for (let i = 0; i < 4; i++) {
							M.nextStep=Date.now();
							M.loopsMult=0.4;
							M.logic();
						}
					}
				},
				growth: {
					text: loc('Click to trigger <b>%1</b> plant growth ticks at once with <b>x%2</b> spread and mutation rate.', [8, 0.2]),
					cost: 1,
					enabled: true,
					func: function() {
						for (let i = 0; i < 8; i++) {
							M.nextStep=Date.now();
							M.loopsMult=0.2;
							M.logic();
						}
					}
				},
				growthModerate: {
					text: loc('Click to trigger <b>%1</b> plant growth ticks at once with <b>x%2</b> spread and mutation rate.', [16, 0.4]),
					cost: 2,
					enabled: false,
					func: function() {
						for (let i = 0; i < 16; i++) {
							M.nextStep=Date.now();
							M.loopsMult=0.4;
							M.logic();
						}
					}
				},
				growthPlus: {
					text: loc('Click to trigger <b>%1</b> plant growth ticks at once with <b>x%2</b> spread and mutation rate.', [32, 0.2]),
					cost: 2,
					enabled: true,
					func: function() {
						for (let i = 0; i < 32; i++) {
							M.nextStep=Date.now();
							M.loopsMult=0.2;
							M.logic();
						}
					}
				},
				forcedMuts: {
					text: loc('Click to trigger <b>1</b> plant growth tick with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation.'),
					cost: 3,
					enabled: true,
					func: function() {
						M.forceMuts = true;
						M.nextStep=Date.now();
					}
				}
			}

			var gardenMutsStr = selectStatement(M.logic.toString(), M.logic.toString().indexOf('for (var loop=0;loop<loops;loop++)'), 0); 
			var gardenMutsStrNew = gardenMutsStr.replace('var muts=M.getMuts(neighs,neighsM);', 'var muts=M.getMuts(neighs,neighsM); if (M.forceMuts && muts.length > 0) { loop--; } else if (M.forceMuts) { break; }').replace('if (list.length>0) M.plot[y][x]=[M.plants[choose(list)].id+1,0];', 'if (list.length>0) { M.plot[y][x]=[M.plants[choose(list)].id+1,0]; break; }');
			gardenMutsStrNew = gardenMutsStrNew.replace('var chance=0.002*weedMult*M.plotBoost[y][x][2];', 'var chance=0.002*weedMult*M.plotBoost[y][x][2]; if (M.forceMuts) { chance = 1; }'); 
			eval('M.logic='+M.logic.toString().replace(gardenMutsStr, gardenMutsStrNew).replace('M.toCompute=true;', 'M.toCompute=true; M.forceMuts = false;').replace('loops*=M.loopsMult;', '').replace('randomFloor(loops*dragonBoost);', 'randomFloor(loops*M.loopsMult*dragonBoost);'));
			///eval('M.refillTooltip='+M.refillTooltip.toString().replace(`with <b>x%1</b> spread and mutation rate for %2.",[3,'<span class="price lump">'+loc("%1 sugar lump",LBeautify(1))+'</span>']`, `with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation, for the price of %1.",['<span class="price lump">'+loc("%1 sugar lump",LBeautify(1))+'</span>']`));

			eval('M.buildPanel='+M.buildPanel.toString().replace('1000*60*10', '1000*60*3').replace('if (/* !M.freeze && */Game.keys[16] && Game.keys[17])', 'if (!decay.gameCan.selectSeeds) { return false; } if (Game.keys[16] && Game.keys[17])'));

			eval('M.tools.harvestAll.func='+M.tools.harvestAll.func.toString().replace(`PlaySound('snd/toneTick.mp3');`, `if (!decay.gameCan.useGardenTools) { return; } PlaySound('snd/toneTick.mp3');`));
			eval('M.tools.freeze.func='+M.tools.freeze.func.toString().replace(`PlaySound('snd/toneTick.mp3');`, `if (!decay.gameCan.useGardenTools) { return; } PlaySound('snd/toneTick.mp3');`).replace('this', `l('gardenTool-2')`).replace('this', `l('gardenTool-2')`));
			eval('M.tools.convert.func='+M.tools.convert.func.toString().replace(`PlaySound('snd/toneTick.mp3');`, `if (!decay.gameCan.useGardenTools) { return; } PlaySound('snd/toneTick.mp3');`));

			M.buildPanel();

			M.tools['convert'].desc=loc("A swarm of sugar hornets comes down on your garden, <span class=\"red\">destroying every plant as well as every seed you've unlocked</span> - leaving only a %1 seed.<br>In exchange, they will grant you <span class=\"green\">%2</span>.<br>This action is only available with a complete seed log.",[loc("Baker's wheat"),loc("%1 sugar lump",LBeautify(30))]);
			eval("M.askConvert="+M.askConvert.toString().replace("10","50"));
			eval("M.convert="+M.convert.toString().replace("10","50"));

			eval('M.unlockSeed='+M.unlockSeed.toString().replace('me.unlocked=1;', 'me.unlocked=1; decay.triggerNotif("garden"); '));

			M.computeStepT();
			M.computeEffs();

			Crumbs.h.resolveInjects();
			gardenUpdated = true; 
		};

		this.reworkStock = function() {
			if (!Game.Objects['Bank'].minigameLoaded || stockUpdated) { return; }
			
			sp = Game.Objects['Bank'].minigame;
			Game.minigames.push(sp);
			
			sp.secondsPerTick=60;
			l('bankNextTick').insertAdjacentHTML('afterend', '<div style="display:inline-block;"><div id="banktickedit" style="display:none;" class="bankButton bankButtonSell"'+'>'+loc("change tick speed"));
			Game.stockMaximumSpeed = 10;
			addLoc('Input to modify the tick speed.');
			addLoc('(Minimum: <b>%1</b> per tick)');
			sp.changeTickspeed = function() {
				if (decay.gameCan.changeTickspeed) { Game.Prompt('<h3>Change tick speed</h3>'+'<div class="line"></div>'+loc("Input to modify the tick speed.")+'<br>'+loc('(Minimum: <b>%1</b> per tick)', Game.sayTime(Game.stockMaximumSpeed * Game.fps))+'<div class="line"></div>'+'<input type="text" id="valuePrompt" style="text-align:center;/></div>',[[("Commit"),'Game.ClosePrompt(); if (Number((l(\'valuePrompt\').value)) >= Game.stockMaximumSpeed) { Game.Objects[`Bank`].minigame.secondsPerTick=Number((l(\'valuePrompt\').value)); } else if (Number((l(\'valuePrompt\').value)) < Game.stockMaximumSpeed) { Game.Objects[`Bank`].minigame.secondsPerTick=Game.stockMaximumSpeed; } '],("Cancel")]); }
			}
			AddEvent(l('banktickedit'),'click',function(e){
				sp.changeTickspeed(); 
			});

			eval('sp.buyGood='+sp.buyGood.toString().replace('var me=M.goodsById[id];', 'if (!decay.gameCan.buyGoods) { return; } var M = sp; var me=M.goodsById[id];'));
			eval('sp.sellGood='+sp.sellGood.toString().replace('var me=M.goodsById[id];', 'if (!decay.gameCan.sellGoods) { return; } var M = sp; var me=M.goodsById[id];'));
			eval('sp.takeLoan='+sp.takeLoan.toString().replace('var loan=M.loanTypes[id-1];', 'if (!decay.gameCan.takeLoans) { return; } var loan=sp.loanTypes[id-1];'));

			sp.offices[0].cost[1] = 1;
			sp.offices[1].cost[1] = 1;
			sp.offices[2].cost[1] = 2;
			sp.offices[3].cost[1] = 2;
			sp.offices[4].cost[1] = 3;
			sp.offices[5].cost[1] = 3;

        	l('banktickedit').style.removeProperty('display');

			stockUpdated = true;
	    };

		//Buffing Muridal and implementing the mouse doubling upgrades
		eval('Game.mouseCps='+Game.mouseCps.toString()
			.replace("if (godLvl==1) mult*=1.15;","if (godLvl==1) mult*=1.25;")
			.replace("else if (godLvl==2) mult*=1.1;","else if (godLvl==2) mult*=1.20;")
			.replace("else if (godLvl==3) mult*=1.05;","else if (godLvl==3) mult*=1.15;")
			.replace(`Game.Has('Reinforced index finger')+Game.Has('Carpal tunnel prevention cream')+Game.Has('Ambidextrous')`, `(Game.Has('Reinforced index finger')+Game.Has('Carpal tunnel prevention cream')+Game.Has('Ambidextrous')+Game.Has('Muscle relaxant')+Game.Has('Trigger fingers')+Game.Has('Non-euclidean baking trays'))*2*(1+Game.Has("Santa's helpers"))`)
		);

        //Buffing Mokalsium negative effect
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("if (godLvl==1) m*=1.15;","if (godLvl==1) m*=1.20;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==2) m*=1.1;","else if (godLvl==2) m*=1.15;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==3) m*=1.05;","else if (godLvl==3) m*=1.1;"));

        //Buffing Jeremy
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) buildMult*=1.1;","if (godLvl==1) buildMult*=1.2;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) buildMult*=1.06;","else if (godLvl==2) buildMult*=1.14;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) buildMult*=1.03;","else if (godLvl==3) buildMult*=1.08;"))
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes["golden"].getTimeMod.toString().replace('if (godLvl==1) m*=1.1;', 'if (godLvl==1) m*=1.06;').replace('else if (godLvl==2) m*=1.06;', 'else if (godLvl==2) m*=1.04;').replace('else if (godLvl==3) m*=1.03;', 'else if (godLvl==3) m*=1.02;'))

        //Nerfing? Cyclius
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"));

		//buffing vomitrax (buff contained within)
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes["golden"].popFunc.toString().replace(`var popup='';`, `var popup=''; mult = Game.goldenGainMult(me.wrath);`));

		//removes skruuia other functions
		eval('Game.shimmerTypes["golden"].initFunc='+Game.shimmerTypes["golden"].initFunc.toString().replace("(Game.hasGod && Game.hasGod('scorn'))", 'false'));

		//dotjeiess original functions removal
		//eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace('Game.hasGod', 'false')); the part is actually in the function override
		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace('Game.hasGod','false'));

		//godzamok + earth shatterer + dragon orbs
		decay.halts['earthShatterer'] = new decay.haltChannel({
			properName: loc('Earth Shatterer'),
			keep: 0.1,
			decMult: 0.5,
			factor: 1,
			power: 0.1,
			tickspeedPow: 1
		});
		addLoc('Curve activated');
		addLoc('Sugar lump wrinkler spawned!');
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace(`if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);`, `if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01,1+sold*0.01);`)
				 .replace(`else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);`, `else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005,1+sold*0.004);`)
				 .replace(`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);`,`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025,1+sold*0.0015);`)
				 .replace('if (success && Game.hasGod)', 'if (success && (Game.auraMult("Earth Shatterer") || (decay.challengeStatus("dualcast") && this.name == "Wizard tower"))) { decay.stop(Math.pow(sold, 0.5) * (decay.challengeStatus("earthShatterer")?1.1:1) * (Game.auraMult("Earth Shatterer")?Game.auraMult("Earth Shatterer"):0.1) * 3, "earthShatterer"); } if (success && Math.random() < 1 / (100000 / Game.auraMult("Dragon\'s Curve"))) { let h = decay.spawnWrinklerLead(); if (h) { h.size += 2; h.lumpCarrying = h.lumpCarrying || choose([1, 2, 4, 4, 4, 4]); decay.createLumpGrowths.call(h); } Game.Notify(loc(\'Curve activated\'), loc(\'Sugar lump wrinkler spawned!\'), [20, 25]); } if (success && Game.hasGod)')
				 .replace('else if (godLvl==2) old.multClick+=sold*0.005;', 'else if (godLvl==2) { old.multClick+=sold*0.005; old.arg2+=sold*0.004; }')
				 .replace('else if (godLvl==3) old.multClick+=sold*0.0025;', 'else if (godLvl==3) { old.multClick+=sold*0.0025; old.arg2+=sold*0.0015; } old.desc = loc("Clicking power +%1% for %2!",[Math.floor(old.multClick*100-100),Game.sayTime(old.time,-1)]);')
				 .replace(`Game.auraMult('Dragon Orbs')*0.1`, `Game.auraMult('Dragon Orbs')*(decay.challengeStatus('comboOrbs')?0.25:0.1)`)
				 .replace('if (buffsN==0)', 'if (buffsN<=(decay.challengeStatus("allBuffStack")?1:0))')
				);
		}
		
		addLoc('Buff boosts clicks by +%1% for every building sold for %2 seconds, ');
		addLoc('but also temporarily increases decay momentum by %1% with every building sold.');
		Game.getSwapTooltip = function() {
			var mult = 1;
			if (decay.challengeStatus('godz')) { mult *= 0.8; }
			return '<div style="padding:8px;width:350px;font-size:11px;text-align:center;">'+loc("Each time you slot a spirit, you use up one worship swap.<div class=\"line\"></div>If you have 2 swaps left, the next one will refill after %1.<br>If you have 1 swap left, the next one will refill after %2.<br>If you have 0 swaps left, you will get one after %3.<div class=\"line\"></div>Unslotting a spirit costs no swaps.",[Game.sayTime(60*5*Game.fps*mult, -1),Game.sayTime(60*5*Game.fps*mult, -1),Game.sayTime(60*20*Game.fps*mult, -1)])+'</div>';
		}
		this.reworkPantheon = function() {
			if (!Game.Objects['Temple'].minigameLoaded || pantheonUpdated) { return; }
			
			//Changing the desc
			let temp = Game.Objects['Temple'].minigame;
			const M = temp;
			Game.minigames.push(temp);
			if (l('templeInfo') === null) { return false; }
			//if (!decay.prefs.preventNotifs['momentum']) { if (!decay.momentumUnlocked) { decay.triggerNotif('momentumUnlock'); } }
			pp = temp;

			eval('pp.logic='+replaceAll('M.', 'pp.', pp.logic.toString()));
			eval('pp.logic='+pp.logic.toString().replace('t=1000*60*60', 't=1000*5*60').replace('t=1000*60*60*16', 't=1000*60*20').replace('t=1000*60*60*4;', '{ t=1000*60*5; } if (decay.challengeStatus("godz")) { t *= 0.8; }'));
			eval('pp.draw='+replaceAll('M.', 'pp.', pp.draw.toString()));
			eval('pp.draw='+pp.draw.toString().replace('t=1000*60*60', 't=1000*5*60').replace('t=1000*60*60*16', 't=1000*60*20').replace('t=1000*60*60*4', '{ t=1000*60*5; } if (decay.challengeStatus("godz")) { t *= 0.8; }'));

			l('templeInfo').innerHTML = '<div '+Game.getDynamicTooltip('Game.ObjectsById['+pp.parent.id+'].minigame.refillTooltip','this')+' id="templeLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-6px;top:-10px;background-position:'+(-29*48)+'px '+(-14*48)+'px;"></div><div id="templeSwaps" '+Game.getDynamicTooltip('Game.getSwapTooltip')+'>-</div>'; pp.swapsL = l('templeSwaps');

			for (let i in M.gods) {
				M.gods[i].unlocked = false;
				M.gods[i].unlockPrice = 1;
			}
			M.gods['ruin'].unlockPrice = 5;
			M.gods['ruin'].requireFtHoF = true;
			M.updateLumpLocks = function() {
				for (let i in M.gods) { 
					if (M.gods[i].unlocked) {
						l('pantheonLumpLock'+M.gods[i].id).style.display = 'none';
					} else {
						l('pantheonLumpLock'+M.gods[i].id).style.display = '';
					}
				} 
			}
			addLoc('unlock <b>%1</b>');
			M.unlockGod = function(god) { 
				if (god.unlocked) { return; }
				Game.spendLump(god.unlockPrice, loc('unlock <b>%1</b>', god.name), function() {
					god.unlocked = true;
					M.updateLumpLocks();
				})(); 
			}
			M.gods['order'].unlocked = true;
			addLoc('Requires <b>%1</b>!');
			addLoc('<b>Cost to unlock:</b>');
			eval('M.godTooltip='+M.godTooltip.toString().replace(`(me.descAfter?('<div class="templeEffect">'+me.descAfter+'</div>'):'')+`, `(me.descAfter?('<div class="templeEffect">'+me.descAfter+'</div>'):'')+
				(me.unlocked?'':('<div class="line"></div>'+((me.requireFtHoF && !gp.spells['hand of fate'].unlocked)?(loc('Requires <b>%1</b>!', loc('Force the Hand of Fate'))):(loc('<b>Cost to unlock:</b>')+ '<span class="price lump'+(Game.lumps>=me.unlockPrice?'':' disabled')+'">'+Beautify(me.unlockPrice)+'</span>'))))+
			`));

			addLoc('unlock god');
			Crumbs.h.injectCSS('.pantheonLumpLock { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; z-index: 100; background: rgba(128, 0, 0, 0.2); }');
			for (let i = 0; i < Object.keys(M.gods).length; i++) {
				let div = document.createElement('div');
				div.classList.add('pantheonLumpLock');
				div.id = 'pantheonLumpLock' + i;
				div.innerHTML = '<div class="usesIcon shadowFilter grimoireIcon" style="transform: translateY(8px); opacity: 0.9; '+writeIcon([29, 14])+'">';
				l('templeGod' + i).appendChild(div);
				AddEvent(l('templeGod' + i), 'click', function() { if (M.godsById[i].unlocked || (M.godsById[i].requireFtHoF && !gp.spells['hand of fate'].unlocked)) { return; } Game.spendLump(M.godsById[i].unlockPrice, loc('unlock god'), function() { M.godsById[i].unlocked = true; M.updateLumpLocks(); })(); });
			}

			M.updateLumpLocks();
			
			/*
			temp.gods['ruin'].desc1='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [1, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[1])+'</span>';
			temp.gods['ruin'].desc2='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.5, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[0.4])+'</span>';
			temp.gods['ruin'].desc3='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.25, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[0.15])+'</span>';
			*/
			addLoc('Note: this effect stacks in strength with multiple sells.');
			temp.gods['ruin'].descAfter = '<span class="green">' + loc('Note: this effect stacks in strength with multiple sells.') + '</div>';
			
			temp.gods['mother'].desc1='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",10)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",20)+'</span>';
			temp.gods['mother'].desc2='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",5)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",15)+'</span>';
			temp.gods['mother'].desc3='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",3)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",10)+'</span>';

			temp.gods['labor'].desc1='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",25)+'</span> <span class="red">'+loc("Buildings produce %1% less.",3)+'</span>';
			temp.gods['labor'].desc2='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",20)+'</span> <span class="red">'+loc("Buildings produce %1% less.",2)+'</span>';
			temp.gods['labor'].desc3='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",15)+'</span> <span class="red">'+loc("Buildings produce %1% less.",1)+'</span>';

			temp.gods['ages'].desc1=loc("Effect cycles over %1 hours.",12);
			temp.gods['ages'].desc2=loc("Effect cycles over %1 hours.",24);
			temp.gods['ages'].desc3=loc("Effect cycles over %1 hours.",48);

			addLoc('While this spirit is slotted, you cannot switch seasons.');
			temp.gods['seasons'].desc1 = '<span class="green">'+loc("Large boost.")+'</span>';
			temp.gods['seasons'].desc2 = '<span class="green">'+loc("Medium boost.")+'</span>';
			temp.gods['seasons'].desc3 = '<span class="green">'+loc("Small boost.")+'</span>';
			temp.gods['seasons'].descAfter = '<span class="red">'+loc("While this spirit is slotted, you cannot switch seasons.")+'</span>';

			addLoc('Clicks halt decay %1% faster.');
			addLoc('You build up fatigue %1% faster.');
			temp.gods['industry'].desc1='<span class="green">'+loc("Clicks halt decay %1% faster.",125)+'</span> <span class="gray">'+loc("You build up fatigue %1% faster.",125)+'</span>';
			temp.gods['industry'].desc2='<span class="green">'+loc("Clicks halt decay %1% faster.",50)+'</span> <span class="gray">'+loc("You build up fatigue %1% faster.",50)+'</span>';
			temp.gods['industry'].desc3='<span class="green">'+loc("Clicks halt decay %1% faster.",20)+'</span> <span class="gray">'+loc("You build up fatigue %1% faster.",20)+'</span>';

			addLoc('Wrinkler move <b>-%1%</b> as fast.');
			addLoc('Wrath cookies replaces Golden cookies with %1% less decay.');
			temp.gods['scorn'].desc1='<span class="green">'+loc('Wrinkler move <b>-%1%</b> as fast.', 30)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 50);
			temp.gods['scorn'].desc2='<span class="green">'+loc('Wrinkler move <b>-%1%</b> as fast.', 20)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 33);
			temp.gods['scorn'].desc3='<span class="green">'+loc('Wrinkler move <b>-%1%</b> as fast.', 10)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 20);
			delete temp.gods['scorn'].descBefore;
			eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`Game.hasGod && Game.hasGod('scorn')`, `false`));

			addLoc('Purifying decay grants a buff.');
			addLoc('-%1% decay for %2 seconds.');
			addLoc('Purifying decay grants a buff that weakens decay propagation.');
			temp.gods['creation'].descBefore='<span class="green">'+loc('Purifying decay grants a buff that weakens decay propagation.')+'</span>';
			temp.gods['creation'].desc1='<span class="green">'+loc('-%1% decay for %2 seconds.', [48, 9])+'</span>';
			temp.gods['creation'].desc2='<span class="green">'+loc('-%1% decay for %2 seconds.', [24, 27])+'</span>';
			temp.gods['creation'].desc3='<span class="green">'+loc('-%1% decay for %2 seconds.', [12, 81])+'</span>';

			addLoc('Decay propagation rate -%1%.');
			temp.gods['asceticism'].desc1='<span class="green">'+loc("+%1% base CpS.",15)+' '+loc('Decay propagation rate -%1%.', 30)+'</span>';
			temp.gods['asceticism'].desc2='<span class="green">'+loc("+%1% base CpS.",10)+' '+loc('Decay propagation rate -%1%.', 20)+'</span>';
			temp.gods['asceticism'].desc3='<span class="green">'+loc("+%1% base CpS.",5)+' '+loc('Decay propagation rate -%1%.', 10)+'</span>';

			addLoc('Sugar lump-carrying wrinklers appear %1x more often.');
			temp.gods['order'].desc1='<span class="green">'+loc('Sugar lump-carrying wrinklers appear %1x more often.', 1.75)+'</span>';
			temp.gods['order'].desc2='<span class="green">'+loc('Sugar lump-carrying wrinklers appear %1x more often.', 1.5)+'</span>';
			temp.gods['order'].desc3='<span class="green">'+loc('Sugar lump-carrying wrinklers appear %1x more often.', 1.25)+'</span>';
			temp.gods['order'].descAfter = '';
			delete temp.gods['order'].activeDescFunc;

            //Making Cyclius display the nerf?
			eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"));
			eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"));
        	eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"));

			addLoc('Golden and wrath cookie gain +%1%.');
			temp.gods['decadence'].desc1='<span class="green">'+loc('Golden and wrath cookie gain +%1%.',77)+'</span> <span class="red">'+loc("Buildings grant -%1% CpS.",7)+'</span>';
			temp.gods['decadence'].desc2='<span class="green">'+loc('Golden and wrath cookie gain +%1%.',57)+'</span> <span class="red">'+loc("Buildings grant -%1% CpS.",5)+'</span>';
			temp.gods['decadence'].desc3='<span class="green">'+loc('Golden and wrath cookie gain +%1%.',37)+'</span> <span class="red">'+loc("Buildings grant -%1% CpS.",2)+'</span>';
			eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`var godLvl=Game.hasGod('decadence');`, `var godLvl=0;`))

			eval("temp.slotGod="+replaceAll('M', 'pp', temp.slotGod.toString()));
			eval("temp.slotGod="+temp.slotGod.toString().replace('Game.recalculateGains=true;', 'Game.recalculateGains=true; decay.setRates();').replace('if (slot==god.slot)', 'if (slot==god.slot || !decay.gameCan.slotGods)'));
			eval("temp.dropGod="+replaceAll('M', 'pp', temp.dropGod.toString()));
			eval('temp.dropGod='+temp.dropGod.toString().replace('if (!pp.dragging)', 'if (!pp.dragging || !decay.gameCan.slotGods || !what.unlocked)'));
			eval("temp.dragGod="+replaceAll('M', 'pp', temp.dragGod.toString()));
			eval('temp.dragGod='+temp.dragGod.toString().replace('pp.dragging=what;', 'if (!decay.gameCan.slotGods || !what.unlocked) { return; } pp.dragging=what;'));
				
			eval('temp.useSwap='+replaceAll('M', 'pp', temp.useSwap.toString()));
			temp.cancelSwapUseChance = function() {
				if (decay.challengeStatus('combo3')) { return 0.1; }
				return 0;
			}
			eval('temp.useSwap='+temp.useSwap.toString().replace('M.swapT=Date.now();', 'if (Math.random() < temp.cancelSwapUseChance()) { return; } M.swapT=Date.now();'))

			Crumbs.h.resolveInjects();

			if (Game.Has('Vial of challenges')) { M.gods['ruin'].unlocked = true; M.updateLumpLocks(); }

			this.loadPantheon(this.pantheonSaveStr);

			for (let i in pp.gods) {
				Game.godsPrimaryNameToCode[pp.gods[i].name.split(',')[0].toLowerCase()] = i;
			}
			pantheonUpdated = true;
		};
		this.savePantheon = function() {
			const M = Game.Objects['Temple'].minigame;
			if (!M) { return ''; }
			let str = '';
			for (let i in M.gods) {
				str += (M.gods[i].unlocked?1:0) + ',';
			}
			str = str.slice(0, str.length - 1);
			return str;
		}
		this.loadPantheon = function(str) {
			if (!isv(str)) {
				const M = pp; 
				if (Game.Has('Vial of challenges') && pantheonUpdated) { M.gods['ruin'].unlocked = true; M.updateLumpLocks(); }
				return; 
			}
			const M = pp;
			let strs = str.split(',');
			for (let i in M.gods) {
				if (isv(strs[M.gods[i].id])) { M.gods[i].unlocked = Boolean(parseInt(strs[M.gods[i].id])); }
			}
			if (Game.Has('Vial of challenges') && pantheonUpdated) { M.gods['ruin'].unlocked = true; }
			M.updateLumpLocks();
		}
		this.wipePantheon = function() {
			const M = Game.Objects['Temple'].minigame;
			if (!M) { return; }
			for (let i in M.gods) {
				M.gods[i].unlocked = false;
			}
			M.gods['order'].unlocked = true;
			M.updateLumpLocks();
		}
	
		//CBG buff
		addLoc('+%1 prestige level effect on CpS for %2!');
		new Game.buffType('haggler dream', function(time, pow) {
			return {
				name:'Haggler\'s dream',
				desc:loc("+%1 prestige level effect on CpS for %2!", [(pow - 1) * 100 + '%', Game.sayTime(time * Game.fps, -1)]),
				icon:[19, 7],
				time:time * Game.fps,
				power:pow,
				aura:1
			};
		});

        //Adding the custom buff to the code
		//eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("if (Game.Has('Lucky payout')) heavenlyMult*=1.01;", "if (Game.Has('Lucky payout')) heavenlyMult*=1.01; if (Game.hasBuff('haggler dream')) heavenlyMult*=Game.hasBuff('haggler dream').power;"));
		//the part where its added is in the override somewhere around here

		allValues('minigames');

		/*=====================================================================================
        Upgrades
        =======================================================================================*/

		window.strCookieProductionMultiplierPlus=loc("Cookie production multiplier <b>+%1%</b>.",'[x]');
		window.getStrCookieProductionMultiplierPlus=function(x)
		{return strCookieProductionMultiplierPlus.replace('[x]',x);}

		//earlygame building prices rework below
		for (let i in Game.Objects) {
			Game.Objects[i].basePrice /= (1 + Game.Objects[i].id);
			for (let ii in Game.Objects[i].tieredUpgrades) { 
				Game.Objects[i].tieredUpgrades[ii].basePrice /= (1 + Game.Objects[i].id);
			}
		}

		decay.ascendKeptUpgradeList = [];
		decay.getAscendKeptUpgradeList = function() {
			let list = [];
			if (decay.challengeStatus('combo2')) { list.push('Lucky day'); }
			if (decay.challengeStatus('comboDragonCursor')) { list.push('A crumbly egg'); }
			if (decay.challengeStatus('sb4')) { list.push('Trigger fingers'); list.push('Non-euclidean baking trays'); }
			if (Game.Has('Your first idea')) { 
				for (let i = 1; i < 8; i++) {
					list.push(Game.Objects['Cortex baker'].tieredUpgrades[i].name);
				}
			}
			if (Game.Has('Keepsakes') && decay.keepsakeSeason) {
				if (decay.keepsakeSeason == 'christmas') { 
					list = list.concat(Game.reindeerDrops);
				} else if (decay.keepsakeSeason == 'halloween') {
					list = list.concat(Game.halloweenDrops);
				} else if (decay.keepsakeSeason == 'easter') {
					list = list.concat(Game.eggDrops.concat(Game.rareEggDrops));
				} else if (decay.keepsakeSeason == 'valentines') {
					list = list.concat(Game.heartDrops);
				}
			}
			if (Game.Has('Polar power')) {
				list = list.concat(kaizoCookies.polargurtUpgrades);
			}

			let newList = [];
			for (let i in list) {
				if (Game.Has(list[i])) { newList.push(list[i]); }
			}
			return newList;
		}
		eval('Game.Reset='+Game.Reset.toString().replace('Game.gainedPrestige=0;', 'Game.gainedPrestige=0; var keepList = decay.getAscendKeptUpgradeList(); decay.ascendKeptUpgradeList = keepList;').replace('BeautifyAll();', 'if (!hard) { for (let i in keepList) { Game.Upgrades[keepList[i]].earn(); } } BeautifyAll();'));
		Game.registerHook('check', function() { decay.ascendKeptUpgradeList = decay.getAscendKeptUpgradeList(); })

		decay.changeUpgradeDescs = function() {
			for (var i in Game.Objects) {//This is used so we can change the message that appears on all tired upgrades when a unshackled buiding is bought
            	for (var ii in Game.Objects[i].tieredUpgrades) {
            	    var me=Game.Objects[i].tieredUpgrades[ii];
            	    if (!(ii=='fortune')&&me.descFunc){eval('me.descFunc='+me.descFunc.toString().replace('this.buildingTie.id==1?0.5:(20-this.buildingTie.id)*0.1)*100','this.buildingTie.id==1?0.45:(20-this.buildingTie.id)*0.09)*100'));}
            	}
        	}  

	        for (var i in Game.Objects) {//This is used so we can change the desc of all unshackled upgrades
	            var s=Game.Upgrades['Unshackled '+Game.Objects[i].plural];
	            var id=Game.Objects[i].id;
	            if (!(i=='Cursor')) {s.baseDesc=s.baseDesc.replace(s.baseDesc.slice(0,s.baseDesc.indexOf('<q>')),'Tiered upgrades for <b>'+i+'</b> provide an extra <b>'+(id==1?'45':(20-id)*9)+'%</b> production.<br>Only works with unshackled upgrade tiers.');}
	        }

			eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//Changing how much unshackled cursors give
			eval("Game.Objects['Cursor'].cps="+Game.Objects['Cursor'].cps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//changing how much unshackled cursors buffs cursors
	
			var getStrThousandFingersGain=function(x)//Variable for the desc of unshackled cursor 
			{return loc("Multiplies the gain from %1 by <b>%2</b>.",[getUpgradeName("Thousand fingers"),x]);}
			replaceDesc('Unshackled cursors', getStrThousandFingersGain(20), true);//Changing the desc to reflect all the changes
	
			eval('Game.GetTieredCpsMult='+Game.GetTieredCpsMult.toString().replace("tierMult+=me.id==1?0.5:(20-me.id)*0.1;","tierMult+=me.id==1?0.45:(20-me.id)*0.09;"))//All unshackled upgrades produce 10% less
		}

		decay.checkGCUpgradeUnlocks = function() {
			if (Game.goldenClicksLocal>=1) { 
				Game.Unlock('Lucky day'); 
				if (Game.goldenClicks>=1) { Game.Unlock('Lucky radar'); }
				if (Game.goldenClicks>=3) { Game.Unlock('Shimmering encapsulation'); }
				if (Game.goldenClicks>=7) { Game.Unlock('Immense flow'); }
			}
			if (Game.goldenClicksLocal>=3) { Game.Unlock('Serendipity'); }
			if (Game.goldenClicksLocal>=7) { Game.Unlock('Get lucky'); }
			if (Game.goldenClicksLocal>=27 && Game.cookiesEarned > 1e50) { Game.Unlock('Chance encounter'); }
		}
		Game.registerHook('check', decay.checkGCUpgradeUnlocks);
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString()
			.replace(`if (Game.goldenClicks>=7) Game.Unlock('Lucky day');`, '')
			.replace(`if (Game.goldenClicks>=27) Game.Unlock('Serendipity');`, '')
			.replace(`if (Game.goldenClicks>=77) Game.Unlock('Get lucky');`, '')
		);
		replaceDesc('Decisive fate', 'The time to spawn golden cookies varies less.', true);
		eval('Game.shimmerTypes.golden.getMaxTime='+Game.shimmerTypes.golden.getMaxTime.toString().replace('10;', '10; if (Game.Has("Decisive fate")) { m *= 0.75; }'));
		eval('Game.shimmerTypes.golden.getMinTime='+Game.shimmerTypes.golden.getMinTime.toString().replace('3.5;', '3.5; if (Game.Has("Decisive fate")) { m *= 1.15; }'));
		eval('Game.shimmerTypes.golden.reset='+Game.shimmerTypes.golden.reset.toString().replace(`this.last='';`, `this.last='multiply cookies';`));

        Game.Upgrades['Pure heart biscuits'].basePrice *=    1;
        Game.Upgrades['Ardent heart biscuits'].basePrice *=  100000000;
        Game.Upgrades['Sour heart biscuits'].basePrice *=    10000000000000000;
        Game.Upgrades['Weeping heart biscuits'].basePrice *= 1000000000000000000000000;
        Game.Upgrades['Golden heart biscuits'].basePrice *=  100000000000000000000000000000000;
		Game.Upgrades['Eternal heart biscuits'].basePrice *= 10000000000000000000000000000000000000000;
		Game.Upgrades['Prism heart biscuits'].basePrice *=   1000000000000000000000000000000000000000000000000;
		addLoc('Power <b>x%1</b> from %2!');
		addLoc('Selebrak');
		addLoc('challenge <b>%1</b>');
		for (let i = 0; i < 7; i++) {
			const u = ['Pure heart biscuits', 'Ardent heart biscuits', 'Sour heart biscuits', 'Weeping heart biscuits', 'Golden heart biscuits', 'Eternal heart biscuits', 'Prism heart biscuits'][i];
			eval('Game.Upgrades["'+u+'"].power='+Game.Upgrades[u].power.toString().replace('2', i + 4).replace('2', i + 4).replace('if (Game.hasGod)', 'if (decay.challengeStatus("dualcast")) { pow *= '+(2 + i * 0.5)+'; } if (Game.hasGod)'));
			Game.Upgrades[u].descFunc = function() {
				let str = [];
				if (Game.Has('Starlove')) { str.push(loc('Power <b>x%1</b> from %2!', [1.5, loc('Starlove')])); }
				if (decay.challengeStatus('dualcast')) { str.push(loc('Power <b>x%1</b> from %2!', [2 + 0.5 * Game.heartDrops.indexOf(this.name), loc('challenge <b>%1</b>', decay.challenges.dualcast.name)])); }
				if (Game.hasGod) {
					const lvl = Game.hasGod('seasons');
					if (lvl == 1) {
						str.push(loc('Power <b>x%1</b> from %2!', [1.3, loc('Selebrak')]));
					} else if (lvl == 2) {
						str.push(loc('Power <b>x%1</b> from %2!', [1.2, loc('Selebrak')]));
					} else if (lvl == 3) {
						str.push(loc('Power <b>x%1</b> from %2!', [1.1, loc('Selebrak')]));
					}
				}
				return (str.length?'<div style="text-align: center;">':'') + str.join('<br>') + (str.length?'</div><div class="line"></div>':'') + this.ddesc;
			}
			replaceDesc(u, getStrCookieProductionMultiplierPlus(4 + i), true);
		}

		Game.Upgrades['Wrinkly cookies'].basePrice = 666666;

		replaceDesc('Keepsakes', 'You keep <b>all</b> flavored cookies or eggs of a season of your choice across ascensions.', true);
		addLoc('Cherish a season');
		addLoc('Click to select this season to cherish.')
		addLoc('Here are all the relevant seasonal upgrades you have, sorted by seasons.<div class=\"line\"></div>When a season is chosen, its upgrades will not be lost on ascension, but you will still need to get them in a run to be kept.<div class=\"line\"></div>You can reassign it anytime you ascend.');
		decay.selectingKeepsakeSeason = '';
		decay.keepsakeSeason = '';
		decay.putSeasonInKeepsakeSlot = function(season) {
			decay.selectingKeepsakeSeason = season;
			l('seasonToSlotNone').style.display = 'none';
			l('seasonToSlotWrap').style.display = 'block';
			l('seasonToSlotWrap').innerHTML = '<div class="crate upgrade enabled" style="'+writeIcon(Game.seasons[season].triggerUpgrade.icon)+'"></div>';
		}
		Game.Upgrades['Keepsakes'].activateFunction = function() {
			decay.selectingKeepsakeSeason = decay.keepsakeSeason;

			let str = '';
			for (let i in Game.seasons) {
				if (i == 'fools') { continue; }
				str += '<div class="crate upgrade enabled" style="'+writeIcon(Game.seasons[i].triggerUpgrade.icon)+'"'+Game.clickStr+'="decay.putSeasonInKeepsakeSlot(\''+i+'\')"'+Game.getTooltip('<div style="min-width:240px;text-align:center;font-size:12px;padding:5px;"><b>' + Game.seasons[i].name + '</b><div class="line"></div>' + loc('Click to select this season to cherish.') + '</div>', 'bottom', true)+'></div>';
			}

			str += '<div style="width: 170px; margin: 10px; height: 2px; background: linear-gradient(to right, #cccccc66, #cccccccc);"></div>';

			let upgradesStr = '';
			upgradesStr += '<div style="padding-bottom: 2px;">' + loc('Christmas') + '</div>' + (Game.listTinyOwnedUpgrades(Game.reindeerDrops) || loc('none')) + '<div class="line"></div>';
			upgradesStr += '<div style="padding-bottom: 2px;">' + loc('Valentine\'s') + '</div>' + (Game.listTinyOwnedUpgrades(Game.heartDrops) || loc('none')) + '<div class="line"></div>';
			upgradesStr += '<div style="padding-bottom: 2px;">' + loc('Easter') + '</div>' + ((Game.listTinyOwnedUpgrades(Game.eggDrops) + Game.listTinyOwnedUpgrades(Game.rareEggDrops)) || loc('none')) + '<div class="line"></div>';
			upgradesStr += '<div style="padding-bottom: 2px;">' + loc('Halloween') + '</div>' + (Game.listTinyOwnedUpgrades(Game.halloweenDrops) || loc('none')) + '<div class="line"></div>';

			Game.Prompt('<id PickPermaSeasonals><h3>'+loc("Cherish a season")+'</h3>'+
			'<div class="line"></div><div style="padding:4px;clear:both;width:98%;display:flex;justify-content:space-between;align-items:center;">'
				+'<div id="seasonsToSelect" style="display:flex;float:left;align-items:center;flex-direction: row;">'+str+'</div>'
				+'<div style="margin-left:auto;display:flex;">'
					+'<div id="seasonToSlotNone" class="crate upgrade enabled" style="'+writeIcon([0, 7])+'display:'+(decay.keepsakeSeason?'none':'block')+'; float: right;"></div>'
					+'<div id="seasonToSlotWrap" style="display:'+(!decay.keepsakeSeason?'none':'block')+'; float: right;">'+('<div class="crate upgrade enabled" style="'+writeIcon(decay.keepsakeSeason?Game.seasons[decay.keepsakeSeason].triggerUpgrade.icon:'')+'"></div>')+'</div>'
				+'</div>'
			+'</div>'+
			'<div class="block crateBox" style="float:left;clear:left;width:235px;padding:4px;height:242px;font:12px Merriweather;font-variant:small-caps;">'+upgradesStr+'</div>'+
			'<div class="block" style="float:right;width:226px;clear:right;height:234px;">'+loc("Here are all the relevant season upgrades you have, sorted by seasons.<div class=\"line\"></div>When a season is chosen, its upgrades will not be lost on ascension, but you will still need to get them in a run to be kept.<div class=\"line\"></div>You can reassign it anytime you ascend.")+'</div>'
			,[[loc("Confirm"),'decay.keepsakeSeason=decay.selectingKeepsakeSeason;Game.BuildAscendTree();decay.ascendKeptUpgradeList=decay.getAscendKeptUpgradeList();Game.ClosePrompt();'],loc("Cancel")],0,'widePrompt');
		}
		Game.Upgrades['Keepsakes'].descFunc = function(context) {
			if (!decay.keepsakeSeason) return this.desc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
			return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(Game.seasons[decay.keepsakeSeason].triggerUpgrade.icon)+' <b>'+Game.seasons[decay.keepsakeSeason].name+'</b><div class="line"></div></div>'+this.ddesc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
		}

		Game.Upgrades['Sound test'].basePrice /= 200;
		replaceDesc('Sound test', 'You unleash <b>10%</b> more prestige. Each big cookie click adds <b>0.<span>0</span><span>0</span>5%</b> onto the multiplier, and each wrinkler pop adds <b>0.25%</b> onto the multiplier, for up to <b>+100%</b> in total.<br>Also unlocks the <b>Jukebox</b>, which allows you to play through every sound file in the game.', true);
		Game.Upgrades['Sound test'].posX = 111;
		Game.Upgrades['Sound test'].posY = 708;
		Game.Upgrades['Sound test'].parents = [];

		Game.Upgrades['Golden switch [off]'].priceFunc = function(){return Game.cookiesPs*10*60;}
		replaceDesc('Golden switch [off]', 'Turning this on will give you a passive <b>+50% CpS</b>, but will prevent golden cookies from spawning.<br>Cost is equal to 10 minutes of CpS.', true);
		Game.Upgrades['Golden switch [on]'].priceFunc = function(){return Game.cookiesPs*10*60;}
		replaceDesc('Golden switch [off]', 'The switch is currently giving you a passive <b>+50% CpS</b>; it also prevents golden cookies from spawning.<br>Turning it off will revert those effects.<br>Cost is equal to 10 minutes of CpS.', true);

		Game.Upgrades['Divine sales'].basePrice = 39999;
		Game.Upgrades['Divine discount'].basePrice = 39999;
		Game.Upgrades['Divine bakeries'].basePrice = 199999;
		Game.Upgrades['Distilled essence of redoubled luck'].basePrice = 777777;

		replaceDesc('Dragon teddy bear', 'Slotting auras no longer sacrifice any buildings.<br>Random drops are <b>3%</b> more common.', true);

		//prestige upgrade potential unlock reworks
		replaceDesc('Heavenly chip secret', 'Unleash up to <b>'+Beautify(100)+'</b> prestige levels, making them each grant <b>+1% CpS</b>.<br>The amount unleashed is also boosted by prestige effect boosts.<q>Grants the knowledge of heavenly chips, and how to use them to make baking more efficient.<br>It\'s a secret to everyone.</q>');
		replaceDesc('Heavenly cookie stand', 'Increase the maximum amount of unleashed prestige levels to <b>'+Beautify(1000)+'</b>.<q>Don\'t forget to visit the heavenly lemonade stand afterwards. When afterlife gives you lemons...</q>');
		Game.Upgrades['Heavenly cookie stand'].basePrice = 1.111111111111111e9;
		replaceDesc('Heavenly bakery', 'Increase the maximum amount of unleashed prestige levels to <b>'+Beautify(10000)+'</b>.<q>Also sells godly cakes and divine pastries. The pretzels aren\'t too bad either.</q>');
		Game.Upgrades['Heavenly bakery'].basePrice = 1.11111111111e15;
		replaceDesc('Heavenly confectionery', 'Increase the maximum amount of unleashed prestige levels to <b>'+Beautify(100000)+'</b>.<q>They say angel bakers work there. They take angel lunch breaks and sometimes go on angel strikes.</q>');
		Game.Upgrades['Heavenly confectionery'].basePrice = 1.11111111111e21;
		replaceDesc('Heavenly key', 'Increase the maximum amount of unleashed prestige levels to <b>'+Beautify(1e6)+'</b>, and also allows you to charge this upgrade over time by sustaining purity, unleashing <b>even more</b> prestige levels.<br>The speed of charging also scales with prestige effect multipliers, the amount of cookies you have made in the run, <b>and</b> is faster the more prestige you have unleashed.<q>This is the key to the pearly (and tasty) gates of pastry heaven, allowing you to access your entire stockpile of heavenly chips for baking purposes.<br>May you use them wisely.</q>');
		Game.Upgrades['Heavenly key'].basePrice = 1.11111111111e28;
		replaceAchievDesc('Wholesome', 'Purchase the <b>Heavenly key</b>, the portal to infinite power.');
		//now Game.GetHeavenlyMultiplier only accounts for multipliers beyond the unlocking upgrades, such as lucky payout and dotjeiess
		Game.activePrestigeCount = 0;
		decay.heavenlyKeyCharge = 0;
		Game.heavenlyMult = 1;
		Game.prestigeUnleashMult = 1;
		Game.SetActivePrestigeCount = function() {
			let base = 0;
			if (Game.Has('Heavenly key')) { 
				base = 1e6;
				return Math.min(Game.heavenlyMult * Game.prestigeUnleashMult * (base * (1 + decay.heavenlyKeyCharge)), Game.prestige);
			} else if (Game.Has('Heavenly confectionery')) { 
				base = 1e5;
			} else if (Game.Has('Heavenly bakery')) {
				base = 1e4;
			} else if (Game.Has('Heavenly cookie stand')) {
				base = 1e3;
			} else if (Game.Has('Heavenly chip secret')) { 
				base = 100;
			}
			return Math.min(base * Game.prestigeUnleashMult * Game.heavenlyMult, Game.prestige);
		}
		decay.updateHeavenlyKeyCharge = function() {
			if (!Game.Has('Heavenly key') || Game.activePrestigeCount >= Game.prestige || decay.gen < 1) { return; }
			const purityMult = Math.max(decay.gen - 1, 0) + Math.pow(Math.max(decay.gen / 6 - 1, 0), 2);
			const progressMult = Math.max(Math.pow(Game.cookiesEarned / (Game.cookiesEarned + Game.cookiesReset), 0.2), 0.5);
			decay.heavenlyKeyCharge += purityMult * Game.heavenlyMult / 20 / Game.fps;
			decay.heavenlyKeyCharge += Math.pow(decay.heavenlyKeyCharge, 0.85) * 0.2 * progressMult * Game.heavenlyMult * purityMult / Game.fps;
			//decay.heavenlyKeyCharge += (purityMult * Math.pow(Game.heavenlyMult, 3)) * Math.max(Math.pow(Game.cookiesEarned / (Game.cookiesEarned + Game.cookiesReset), 0.5), 0.02) * 2 / Game.fps;
		}
		//alternate solution: have the charging speed slow down with charges and it's linearly converted into prestige unleashed, but have increased max purity gained this ascend also decrease the slow down rate (e.g. softcap) to make for a better mechanic
		decay.checkPotentialUpgradeUnlocks = function() {
			if (Game.activePrestigeCount >= Game.prestige || Game.Has('Heavenly key')) {
				return; 
			}
			Game.Unlock('Heavenly chip secret');
			if (Game.Has('Heavenly chip secret') && Game.prestige > 100) { Game.Unlock('Heavenly cookie stand'); }
			if (Game.Has('Heavenly cookie stand') && Game.prestige > 1000) { Game.Unlock('Heavenly bakery'); }
			if (Game.Has('Heavenly bakery') && Game.prestige > 10000) { Game.Unlock('Heavenly confectionery'); }
			if (Game.Has('Heavenly confectionery') && Game.prestige > 100000) { Game.Unlock('Heavenly key'); }
		}
		eval('Game.Logic='+Game.Logic.toString().replace(`Game.Has('Legacy') && Game.ascensionMode!=1`, 'false'));
		addLoc('with %1 prestige levels unleashed <b>(+%2% CpS)</b>');
		addLoc('at x%1 effect and count'); addLoc('and additional x%1 count');
		addLoc('fully unleashed <b>(+%1% CpS)</b>');
		decay.getPrestigeLevelUnleashText = function() {
			if (Game.activePrestigeCount == Game.prestige) {
				return loc('fully unleashed <b>(+%1% CpS)</b>', Beautify(decay.getCpSBoostFromPrestige()*100,1)) + ((Game.GetHeavenlyMultiplier()>1 || Game.GetPrestigeUnleashMultiplier()>1)?(' '+loc("at x%1 effect and count", Beautify(Game.GetHeavenlyMultiplier(), 2))):'') + ((Game.GetPrestigeUnleashMultiplier()>1)?(', '+loc('and additional x%1 count', Beautify(Game.GetPrestigeUnleashMultiplier(), 2))):(''));
			}
			return loc("with %1 prestige levels unleashed <b>(+%2% CpS)</b>", [Beautify(Game.activePrestigeCount), Beautify(decay.getCpSBoostFromPrestige()*100,1)]) + (((Game.GetHeavenlyMultiplier()>1 || Game.GetPrestigeUnleashMultiplier()>1))?(' '+loc("at x%1 effect and count", Beautify(Game.GetHeavenlyMultiplier(), 2))):('')) + ((Game.GetPrestigeUnleashMultiplier()>1)?(', '+loc('and additional x%1 count', Beautify(Game.GetPrestigeUnleashMultiplier(), 2))):(''));
		}
		Game.GetHeavenlyMultiplier=function()
		{
			var heavenlyMult = 1;
			heavenlyMult*=1+Game.auraMult('Dragon God')*0.4;
			if (Game.hasBuff('Haggler\'s dream')) heavenlyMult*=Game.hasBuff('Haggler\'s dream').power;
			if (Game.hasBuff('Power poked')) heavenlyMult*=Game.hasBuff('Power poked').power;
			if (Game.Has('Lucky digit')) heavenlyMult*=1.01;
			if (Game.Has('Lucky number')) heavenlyMult*=1.01;
			if (Game.Has('Lucky payout')) heavenlyMult*=1.01;
			if (Game.Has('Rainy day lumps')) {
				let total = 0;
				for (let i in Game.Objects) {
					total += Game.Objects[i].level;
				}
				heavenlyMult *= 1 + Math.min(total, 200) * 0.01;
			}
			return heavenlyMult;
		}
		Game.GetPrestigeUnleashMultiplier=function() {
			let mult = 1;
			if (Game.Has('Sound test')) { 
				mult *= Math.min(1.1 + (Game.cookieClicks + decay.clicksKept) * 0.00005 + Game.wrinklersPopped * 0.0025, 2);
			}
			mult *= 1 + decay.prestigeEscalationScrollBoostCount * 0.15;
			let eggMult = 1;
			let cookieMult = 1;
			if (decay.challengeStatus('seasonalCookies')) {
				for (let i in Game.eggDrops) {
					if (Game.Has(Game.eggDrops[i])) { eggMult += 0.05; }
				}
				for (let i in Game.rareEggDrops) {
					if (Game.Has(Game.rareEggDrops[i])) { eggMult += 0.1; }
				}
				for (let i in Game.halloweenDrops) {
					if (Game.Has(Game.halloweenDrops[i])) { cookieMult += 0.12; }
				}
				for (let i in Game.reindeerDrops) {
					if (Game.Has(Game.reindeerDrops[i])) { cookieMult += 0.12; }
				}
			}
			mult *= eggMult * cookieMult;
			return mult;
		}
		Game.registerHook('logic', function() { Game.heavenlyMult = Game.GetHeavenlyMultiplier(); Game.prestigeUnleashMult = Game.GetPrestigeUnleashMultiplier(); if (Game.T%3) { decay.updateHeavenlyKeyCharge(); Game.activePrestigeCount = Game.SetActivePrestigeCount(); decay.checkPotentialUpgradeUnlocks(); if (Game.onMenu == 'stats' && l("prestigePowerDisplay")) { l("prestigePowerDisplay").innerHTML = decay.getPrestigeLevelUnleashText(); } } });
		Game.registerHook('cps', function(v) { Game.activePrestigeCount = Game.SetActivePrestigeCount(); return v; });
		Game.registerHook('reset', function() { decay.heavenlyKeyCharge = 0; });
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
		.replace(
			`loc("at %1% of its potential <b>(+%2% CpS)</b>",[Beautify(heavenlyMult*100,1),Beautify(decay.getCpSBoostFromPrestige(),1)])`, 
			`'<div id="prestigePowerDisplay" style="margin-top: 3px;">'+decay.getPrestigeLevelUnleashText()+'</div>'`
		));
		injectCSS('#notes.shifted { bottom: 60px; }');
		injectCSS('#prestigeProgress { width: 360px; height: 36px; position: absolute; margin-left: -180px; transform: translateX(-9px); padding: 6px; bottom: 0px; left: 50%; z-index: 1001; }');
		injectCSS('#prestigeProgressBar { max-width:95%;margin:4px auto;height:12px; }');
		injectCSS('#prestigeProgressFull { transform:scale(1,2);transform-origin:50% 0;height:50%; }');
		injectCSS('#prestigeDisplayText { width: 100%; text-align: center; margin: auto; padding-bottom: 2px; }');
		addLoc('%1% prestige unleashed (%2 / %3)'); //add a +x/s
		const preP = document.createElement('div');
		preP.id = 'prestigeProgress';
		preP.classList.add('framed');
		preP.style.display = 'none';
		preP.innerHTML = `<div id="prestigeDisplayText">testtsettest</div>
			<div id="prestigeProgressBar" class="smallFramed meterContainer">
				<div id="prestigeProgressFull" class="meter filling" style="width:1px;"></div>
			</div>`;
		l('notes').insertAdjacentElement('afterend', preP);
		decay.togglePreP = function(show) {
			if (typeof show === 'undefined') { show = l('prestigeProgress').style.display === 'none'; }
			l('prestigeProgress').style.display = show?'block':'none';
			if (show) { l('notes').classList.add('shifted'); }
			else { l('notes').classList.remove('shifted'); }
		};
		decay.prePText = l('prestigeDisplayText');
		decay.prePBar = l('prestigeProgressBar');
		decay.prePFill = l('prestigeProgressFull');
		decay.updatePreP = function() {
			decay.prePText.innerText = loc('%1% prestige unleashed (%2 / %3)', [Beautify(Game.activePrestigeCount / Game.prestige * 100, 1), numberFormatters[0](Math.floor(Game.activePrestigeCount)), numberFormatters[0](Math.floor(Game.prestige))]);
			decay.prePFill.style.backgroundPosition = (-Game.T*0.25)+'px';
			decay.prePFill.style.width = ((Game.activePrestigeCount / Game.prestige) * 100) + '%';
		}
		Game.registerHook('logic', decay.updatePreP);

		eval('Game.CalculateGains='+Game.CalculateGains.toString()
			.replace(`mult+=parseFloat(Game.prestige)*0.01*Game.heavenlyPower*Game.GetHeavenlyMultiplier();`, 'mult+=decay.getCpSBoostFromPrestige();')
			.replace(`var milkMult=1;`, `var milkMult=0.5;`) //milk is too powerful
		);

		const christmasDropStr = selectStatement(Game.shimmerTypes.reindeer.popFunc.toString(), Game.shimmerTypes.reindeer.popFunc.toString().indexOf('if (Math.random()>failRate)'));
		const replacedChristmasDropStr = `if (Math.random()>failRate)
					{
	 const arr = ['Christmas tree biscuits','Snowflake biscuits','Snowman biscuits','Holly biscuits','Candy cane biscuits','Bell biscuits','Present biscuits'];
						cookie=choose(arr);
						
	  for (let i = 0; i < 4; i++) { if (!Game.HasUnlocked(cookie) && !Game.Has(cookie)) { Game.Unlock(cookie); break; } else { cookie = choose(arr); if (i == 3) { cookie = ''; } } }
					}`
		eval('Game.shimmerTypes.reindeer.popFunc='+Game.shimmerTypes.reindeer.popFunc.toString().replace(christmasDropStr, replacedChristmasDropStr));

		Game.recalcAchievCount = function() {
			var counter = 0;
			for (let i in Game.Achievements) {
				if (Game.Achievements[i].won && Game.CountsAsAchievementOwned(Game.Achievements[i].pool)) { counter++; }
			}
			Game.AchievementsOwned = counter;
			return counter;
		}

		decay.seasonSwitcherPriceFunc = function(){
			if (Game.hasGod && Game.hasGod('seasons')) {
				return 1e300; //Want to put Infinity here but afraid itll break the game somewhere
			}
			return Game.seasonTriggerBasePrice+Game.unbuffedCps*60*(Math.pow(1.5,Game.seasonUses) - 1);
		}
		Game.computeSeasonPrices = function () {
			for (var i in Game.seasons) {
				Game.seasons[i].triggerUpgrade.priceFunc = decay.seasonSwitcherPriceFunc;
			}
		}
		Game.computeSeasonPrices();

		//santa changes
		Game.santaSoulReqGet = function(index) {
			let amount = Game.santaSoulReqs[index];
			if (Game.Has('A golden hat')) { amount = Math.floor(amount / 2); }
			amount -= Game.Has('Wrinkly balls');
			return Math.max(amount, 0);
		}
		Game.santaShinySoulReqGet = function(index) {
			let amount = Game.santaShinySoulReqs[index];
			if (Game.Has('A golden hat')) { amount = Math.floor(amount / 2); }
			return Math.max(amount, 0);
		}
		eval('Game.UpgradeSanta='+Game.UpgradeSanta.toString()
			.replace('var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);', 'var moni=(Game.Has("Season switcher")?1:1e9)*Math.pow((Game.santaLevel+1)*1.2,(Game.santaLevel+1)*1.2);')
			.replace('Game.cookies>moni', 'Game.cookies>moni && decay.utenglobeStorage.soul.amount >= Game.santaSoulReqGet(Game.santaLevel) && decay.utenglobeStorage.shinySoul.amount >= Game.santaShinySoulReqGet(Game.santaLevel)')
			.replace('Game.Spend(moni);', 'Game.Spend(moni); decay.utenglobeStorage.soul.lose(Game.santaSoulReqGet(Game.santaLevel)); decay.utenglobeStorage.shinySoul.lose(Game.santaShinySoulReqGet(Game.santaLevel)); if (Game.ascensionMode == 42069 && Game.santaSoulReqGet(Game.santaLevel) > 0) { decay.challenges["buildingCount"].makeCannotComplete(); }')
		);
		addLoc('%1 soul', ['%1 soul', '%1 souls']);
		addLoc('%1 shiny soul', ['%1 shiny soul', '%1 shiny souls']);
		Game.santaSoulReqs = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 7, 12, 44]; //14 levels
		Game.santaShinySoulReqs = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 6];
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString()
			.replace('var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);', 'var moni=(Game.Has("Season switcher")?1:1e9)*Math.pow((Game.santaLevel+1)*1.2,(Game.santaLevel+1)*1.2);')
			.replace(`'<div style="display:table-cell;vertical-align:middle;font-size:65%;">'+loc("sacrifice %1",'<div'+(Game.cookies>moni?'':' style="color:#777;"')+'>'+loc("%1 cookie",LBeautify(Math.pow(Game.santaLevel+1,Game.santaLevel+1)))+'</div>')+'</div>'+`, `'<div style="display:table-cell;vertical-align:middle;font-size:65%;">'+'<div'+((Game.cookies>moni&&decay.utenglobeStorage.soul.amount>=Game.santaSoulReqGet(Game.santaLevel)&&decay.utenglobeStorage.shinySoul.amount>=Game.santaShinySoulReqGet(Game.santaLevel))?'':' style="color:#777;"')+'>'+loc("%1 cookie",LBeautify(moni))+'<br>'+((Game.santaSoulReqGet(Game.santaLevel) > 0)?loc('%1 soul',LBeautify(Game.santaSoulReqGet(Game.santaLevel))):'')+(Game.santaShinySoulReqGet(Game.santaLevel)>0?('<br>'+loc('%1 shiny soul',LBeautify(Game.santaShinySoulReqGet(Game.santaLevel)))):'')+'</div></div>'+`)
			.replace(`if (Game.santaLevel<14)`, `if (Game.santaLevel>=14) { str += decay.getSantaFinalStageContents(); } else if (Game.santaLevel<14)`)
		);
		addLoc('Also makes all santa\'s gifts <b>%1</b> times cheaper.');
		replaceDesc('Season switcher', 'Allow you to <b>trigger seasonal events</b> at will, for a price.' + '<br>' + loc('Also makes all santa\'s gifts <b>%1</b> times cheaper.', Beautify(1e9)) + '<q>' + 'There will always be time.' + '</q>');
		Game.seasonTriggerBasePrice = 1e6;
		Game.santaUpgradesBought = 0;
		Game.recalcSantaUpgradesBought = function() {
			let count = 0;
			for (let i in Game.santaDrops) {
				if (Game.Has(Game.santaDrops[i])) { count++; }
			}
			Game.santaUpgradesBought = count;
		}
		Game.recalcSantaUpgradesBought();
		addLoc('Cost increases by <b>12 times</b> for each santa upgrade bought.');
		Game.registerHook('check', Game.recalcSantaUpgradesBought);
		for (let i in Game.santaDrops) {
			Game.Upgrades[Game.santaDrops[i]].priceFunc=function(){return Math.pow(12,Game.santaUpgradesBought)*2525;}
			Game.Upgrades[Game.santaDrops[i]].buyFunction=Game.recalcSantaUpgradesBought;
		}
		Game.Upgrades['Santa\'s dominion'].basePrice = Math.pow(18, 18);
		Game.Upgrades['A festive hat'].priceFunc = function() {
			return 25 * (Game.Has('Season switcher')?1:1e9);
		}
		addLoc('The latest building produces <b>%1%</b> more.');
		addLoc('All buildings are <b>%1%</b> cheaper.');
		addLoc('All upgrades are <b>%1%</b> cheaper.');
		replaceDesc('Toy workshop', loc('All upgrades are <b>%1%</b> cheaper.', 25), true);
		eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace(`if (Game.Has('Toy workshop')) price*=0.95;`, `if (Game.Has('Toy workshop')) price*=0.75;`));
		replaceDesc('Season savings', loc('All buildings are <b>%1%</b> cheaper.', 25), true);
		replaceDesc('Naughty list', 'Grandmas are <b>twice</b> as efficient.<br>Grandmas are <b>100 times</b> cheaper.', true);
		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace(`if (Game.Has('Season savings')) price*=0.99;`, `if (Game.Has('Season savings')) price*=0.75; if (building.name=='Grandma' && Game.Has('Naughty list')) price *= 0.01;`))
		replaceDesc('Santa\'s legacy', 'Cookie production multiplier <b>+5% per Santa\'s levels</b>.', true);
		replaceDesc('A lump of coal', loc('Cookie production multiplier <b>+%1%</b>.', 5), true);
		replaceDesc('An itchy sweater', loc('Cookie production multiplier <b>+%1%</b>.', 5), true);
		replaceDesc('Increased merriness', loc('Cookie production multiplier <b>+%1%</b>.', 25), true);
		replaceDesc('Improved jolliness', loc('Cookie production multiplier <b>+%1%</b>.', 25), true);
		replaceDesc('Santa\'s dominion', 'Cookie production multiplier <b>+122%</b>.<br>All buildings are <b>1% cheaper</b>.<br>All upgrades are <b>2% cheaper</b>.', true);
		eval('Game.CalculateGains='+Game.CalculateGains.toString()
			.replace('mult*=1.15', 'mult*=1.25')
			.replace('mult*=1.15', 'mult*=1.25')
			.replace(`if (Game.Has('A lump of coal')) mult*=1.01;`, `if (Game.Has('A lump of coal')) mult*=1.05;`)
			.replace(`if (Game.Has('An itchy sweater')) mult*=1.01;`, `if (Game.Has('An itchy sweater')) mult*=1.05;`)
			.replace(`if (Game.Has('Santa\\'s legacy')) mult*=1+(Game.santaLevel+1)*0.03;`, `if (Game.Has('Santa\\'s legacy')) mult*=1+(Game.santaLevel+1)*0.05;`)
			.replace(`if (Game.Has('Santa\\'s dominion')) mult*=1.2;`, `if (Game.Has('Santa\\'s dominion')) mult*=2.22;`)
		);
		replaceDesc('Santa\'s helpers', 'Clicking is <b>50%</b> more powerful, and the six mouse efficiency quadrupling upgrades <b>multiply by 16</b> instead.', true);
		eval('Game.mouseCps='+Game.mouseCps.toString().replace(`if (Game.Has('Santa\'s helpers')) mult*=1.1;`, `if (Game.Has('Santa\'s helpers')) mult*=1.5;`));
		replaceDesc('Santa\'s bottomless bag', 'Random drops are <b>10%</b> more common.<br>Decay rates <b>-10%</b>.', true);
		replaceDesc('Ho ho ho-flavored frosting', 'Reindeer give <b>4 times as much</b>.', true);
		replaceDesc('Weighted sleighs', 'Reindeers are <b>twice as slow</b>.<br>Clicking a reindeer briefly <b>halts decay</b>.', true);
		eval('Game.shimmerTypes.reindeer.popFunc='+Game.shimmerTypes.reindeer.popFunc.toString().replace(`if (Game.Has('Ho ho ho-flavored frosting')) moni*=2;`, `if (Game.Has('Ho ho ho-flavored frosting')) moni*=4;`));
		for (let i in Game.santaDrops) {
			Game.Upgrades[Game.santaDrops[i]].desc = Game.Upgrades[Game.santaDrops[i]].desc.slice(0, Game.Upgrades[Game.santaDrops[i]].desc.indexOf('<q>')) + '<br>' + loc('Cost increases by <b>12 times</b> for each santa upgrade bought.') + Game.Upgrades[Game.santaDrops[i]].desc.slice(Game.Upgrades[Game.santaDrops[i]].desc.indexOf('<q>'), Game.Upgrades[Game.santaDrops[i]].desc.length);
			Game.Upgrades[Game.santaDrops[i]].desc = Game.Upgrades[Game.santaDrops[i]].desc.replace('<br>'+loc('Cost scales with Santa level.'), '');
		}
		decay.getSantaFinalStageContents = function() {
			return '<div class="line"></div>'+
			'<div class="optionBox" style="margin-bottom:0px;"><a style="line-height:80%;" class="option framed large title" '+Game.clickStr+'="decay.summonReindeerFrenzy();">'+
				'<div style="display:table-cell;vertical-align:middle;line-height:100%;">'+loc("Summon reindeer frenzy")+'</div>'+
				'<div style="display:table-cell;vertical-align:middle;padding:4px 12px;">|</div>'+
				'<div style="display:table-cell;vertical-align:middle;font-size:65%;width:30%;">'+'<div '+((decay.utenglobeStorage.soul.amount>=16&&decay.utenglobeStorage.shinySoul.amount>=4)?'':'style="color:#777;"')+'>'+
					loc('%1 soul',LBeautify(16))+'<br>'+
					loc('%1 shiny soul',LBeautify(4))+
				'</div></div>'+
			'</a></div>';
		}
		addLoc('Reindeer frenzy');
		addLoc('Reindeers incoming!')
		new Game.buffType('reindeerFrenzy', function(time) {
			return {
				name: 'Reindeer frenzy',
				desc: loc('Reindeers incoming!'),
				icon: [21, 2, kaizoCookies.images.custImg],
				time: time*Game.fps,
				add: true,
				aura: 1
			}
		});
		decay.summonReindeerFrenzy = function() {
			if (!(decay.utenglobeStorage.soul.amount>=16&&decay.utenglobeStorage.shinySoul.amount>=4)) { return; }
			Game.gainBuff('reindeerFrenzy', 7);
			decay.reindeerFrenzyLastSpawn = Game.T;
			decay.utenglobeStorage.soul.lose(16);
			decay.utenglobeStorage.shinySoul.lose(4);
			Game.ToggleSpecialMenu(1);
			Game.Win('Mass reindeer duplication');
		}
		decay.reindeerFrenzyLastSpawn = 0;
		Game.registerHook('logic', function() {
			if (!Game.hasBuff('Reindeer frenzy')) { 
				return;
			}

			if (Math.random() < (Game.T - decay.reindeerFrenzyLastSpawn) / (Game.fps / 2)) {
				let h = new Game.shimmer('reindeer');
				h.spawnLead = 1; 
				decay.reindeerFrenzyLastSpawn = Game.T;
			}
		});
		eval('Game.shimmerTypes.reindeer.initFunc='+Game.shimmerTypes.reindeer.initFunc.toString().replace(`if (Game.Has('Weighted sleighs')) dur*=2;`, `if (Game.Has('Weighted sleighs') && !Game.hasBuff('Reindeer frenzy')) dur*=2;`));

		replaceDesc('Stevia Caelestis', 'Sugar lump-carrying wrinklers are <b>25%</b> more likely to carry special sugar lumps.', true);
		replaceDesc('Diabetica Daemonicus', 'You deal <b>30%</b> more damage to lump-carrying wrinklers.', true);
		replaceDesc('Sugar aging process', 'Each Grandma makes meaty sugar lumps <b>0.<span>0</span>6%</b> more common and make meaty sugar lumps give <b>0.<span>0</span>6%</b> more, for up to 666 Grandmas.', true);
		replaceDesc('Sucralosia Inutilis', 'Bifurcated sugar lumps give 2 sugar lumps <b>75%</b> of the times instead of 50%.', true);
		Game.Upgrades['Kitten wages'].basePrice /= 1000;

		Game.synergyPriceFunc = function() { return (this.buildingTie1.basePrice*this.buildingTie2.basePrice)*Game.Tiers[this.tier].price*(Game.Has('Chimera')?0.98:1); }
		Game.Tiers.synergy1.price = 200;
		Game.Tiers.synergy2.price = 2000000000;
		for (let i in Game.Upgrades) {
			if (Game.Upgrades[i].tier == 'synergy1') {
				Game.Upgrades[i].basePrice = Game.Upgrades[i].buildingTie1.basePrice * Game.Upgrades[i].buildingTie2.basePrice * Game.Tiers['synergy1'].price;
                Game.Upgrades[i].priceFunc = Game.synergyPriceFunc;
			}
			if (Game.Upgrades[i].tier == 'synergy2') {
				Game.Upgrades[i].basePrice = Game.Upgrades[i].buildingTie1.basePrice * Game.Upgrades[i].buildingTie2.basePrice * Game.Tiers['synergy2'].price;
                Game.Upgrades[i].priceFunc = Game.synergyPriceFunc;
			}
		}

		replaceDesc('Distilled essence of redoubled luck', 'Naturally spawning golden cookies have a <b>20%</b> chance to spawn another golden cookie alongside it; the second golden cookie will always give Lucky.', true);
		eval('Game.updateShimmers='+Game.updateShimmers.toString().replace('Math.random()<0.01) var newShimmer=new Game.shimmer(i);', 'Math.random()<0.2 && i == "golden") { var newShimmer=new Game.shimmer(i); newShimmer.force = "multiply cookies"; }'))

		//always permaslottable assign
		//DO NOT change upgrades order in the array!!! if removing, set to null
		decay.alwaysPermaslottables = []; //add later
		decay.setAlwaysPermaslottables = function() {
			for (let i in decay.alwaysPermaslottables) {
				if (!decay.alwaysPermaslottables[i]) { continue; }
				Game.Upgrades[decay.alwaysPermaslottables[i]].alwaysPermaslottable = true;
				Game.Upgrades[decay.alwaysPermaslottables[i]].everBought = !!Game.Has(decay.alwaysPermaslottables[i]);
			}
			eval('Game.Upgrade.prototype.buy='+Game.Upgrade.prototype.buy.toString().replace('Game.Spend(price);', 'Game.Spend(price); if (this.alwaysPermaslottable) { this.everBought = true; } '));
			decay.saveEverBoughts = function() {
				let str = '';
				for (let i in decay.alwaysPermaslottables) {
					if (!decay.alwaysPermaslottables[i]) { str += 'n'; continue; }
					str += Game.Upgrades[decay.alwaysPermaslottables[i]].everBought?1:0;
				}
				return str;
			}
			decay.loadEverBoughts = function(str) {
				for (let i = 0; i < str.length; i++) {
					if (!decay.alwaysPermaslottables[i]) { continue; }
					Game.Upgrades[decay.alwaysPermaslottables[i]].everBought = Boolean(parseInt(str[i]));
				}
			}
			eval('Game.crateTooltip='+Game.crateTooltip.toString().replace(`if (me.isVaulted()) tags.push(loc("Vaulted"),'#4e7566');`, `if (me.isVaulted()) tags.push(loc("Vaulted"),'#4e7566'); if (me.alwaysPermaslottable && (me.everBought || me.unlocked)) { tags.push(loc('Always permaslottable'), '#8fdcf7'); } if (decay.ascendKeptUpgradeList.includes(me.name)) { tags.push(loc('Kept on ascensions'), '#2bffbc'); } else if (Game.permanentUpgrades.includes(me.id) || Game.EnchantedPermanentUpgrades.includes(me.id)) { tags.push(loc('Kept on ascensions'), 'rgb(171, 81, 255)'); }`));
			eval('Game.AssignPermanentSlot='+Game.AssignPermanentSlot.toString().replace('me.bought && me.unlocked && !me.noPerm', '((me.bought && me.unlocked) || (me.alwaysPermaslottable && me.everBought)) && !me.noPerm'));
		}

		for (let i in Game.Objects) {
			Game.Upgrades[Game.Objects[i].unshackleUpgrade].basePrice = Math.pow(Game.Objects[i].id + 1, 5.5)*30000000;
		}
		for (let i in Game.Tiers) {
			if (Game.Tiers[i].special) { continue; }
			Game.Upgrades[Game.Tiers[i].unshackleUpgrade].basePrice = Math.pow(parseFloat(i), 6)*20000000;
		}

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('eggMult*=1+(1-Math.pow(1-day/100,3))*0.1;', 'eggMult*=1+(1-Math.pow(1-Math.min(Game.TCount / Game.fps / 3600 / 12, 1), 3))*0.25;'));
		//century egg descFunc set in the challenges section

		//building locks
		injectCSS(`.priceBuildings { font-weight:bold; color:#f66; padding-left:18px; position:relative; }`);
		injectCSS(`.priceBuildings:before {
			content:'';
			display:block;
			position:absolute;
			left:0px;
			top:2px;
			background:url(${kaizoCookies.images.buildingIcon});
			width:16px;
			height:16px;
		}`);
		const prevReqs = [
			0, 5, 10, 15, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 50, 50, 50, 50
		];
		decay.checkBuildingEverUnlocks = function() {
			for (let i in Game.Objects) {
				if (Game.Objects[i].prevBuilding.amount >= Game.Objects[i].prevReq || Game.Has('Vial of challenges')) {
					Game.Objects[i].everUnlocked = true;
				}
			}
		}
		for (let i in Game.Objects) {
			Game.Objects[i].prevReq = prevReqs[Game.Objects[i].id];
			Game.Objects[i].prevBuilding = Game.ObjectsById[Math.max(Game.Objects[i].id - 1, 0)];
			Game.Objects[i].nextBuilding = Game.ObjectsById[Math.min(Game.Objects[i].id + 1, Game.ObjectsById.length - 1)];
			Game.Objects[i].everUnlocked = false;
			eval('Game.Objects["'+i+'"].rebuild='+Game.Objects[i].rebuild.toString()
				.replace(`l('productPrice'+me.id).textContent=Beautify(Math.round(price));`, `l('productPrice'+me.id).textContent=price; l('productPrice'+me.id).classList.remove('price'); l('productPrice'+me.id).classList.remove('priceBuildings'); if (me.everUnlocked) { l('productPrice'+me.id).classList.add('price'); } else { l('productPrice'+me.id).classList.add('priceBuildings'); }`)
				.replace(`var price=me.bulkPrice;`, `var price=me.everUnlocked?Beautify(Math.round(me.bulkPrice)):(Beautify(me.prevReq) + ' ' + (me.prevBuilding.locked?'???':cap(me.prevBuilding.plural)));`)
			);
			eval('Game.Objects["'+i+'"].refresh='+Game.Objects[i].refresh.toString().replace(`function()`, `function(noPropagate)`).replace(`//if (!this.onMinigame && !this.muted) {}`, `if (!noPropagate) { this.nextBuilding.refresh(true); } //if (!this.onMinigame && !this.muted) {}`));
			eval('Game.Objects["'+i+'"].buy='+Game.Objects[i].buy.toString().replace(`success=1;`, `decay.checkBuildingEverUnlocks(); success=1;`).replace(`Game.cookies>=price`, `this.everUnlocked && Game.cookies>=price`));
			eval('Game.Objects["'+i+'"].buyFree='+Game.Objects[i].buyFree.toString().replace(`this.refresh();`, `this.refresh(); decay.checkBuildingEverUnlocks();`));
			eval('Game.Objects["'+i+'"].getFree='+Game.Objects[i].getFree.toString().replace(`this.refresh();`, `this.refresh(); decay.checkBuildingEverUnlocks();`));
		}
		eval('Game.Draw='+Game.Draw.toString().replace(`(Game.buyMode==1 && Game.cookies>=price) || (Game.buyMode==-1 && me.amount>0)`, `(Game.buyMode==1 && Game.cookies>=price && me.everUnlocked) || (Game.buyMode==-1 && me.amount>0)`))
		Game.Objects.Cursor.everUnlocked = true;
		decay.checkBuildingEverUnlocks();

		/*=====================================================================================
        Dragon auras
        =======================================================================================*/
		Game.getAuraUnlockCost = function(building) {
			let amount = 100 + building.id * 10;
			if (decay.challengeStatus('comboDragonCursor')) { amount -= 50; }
			if (decay.isConditional('comboOrbs')) { return 2; }

			return Math.floor(amount);
		}
		Game.getBakeDragonCookieCost = function() {
			let amount = 300;
			return amount;
		}
		Game.getDualwieldAuraCost = function() {
			let amount = 400;
			return amount;
		}
		Game.rebuildAuraCosts = function() {
			for (var i=0;i<Game.dragonLevels.length;i++) {
				var it=Game.dragonLevels[i];
				it.name=loc(it.name);
				if (i>=4 && i<Game.dragonLevels.length-3) {
					if (!EN) it.action=loc("Train %1",Game.dragonAuras[i-3].dname)+'<br><small>'+loc("Aura: %1",Game.dragonAuras[i-3].desc)+'</small>';
					if (i>=5) {
						it.costStr=function(building){return function(){return loc("%1 "+building.bsingle,LBeautify(Game.getAuraUnlockCost(building)));}}(Game.ObjectsById[i-5]);
						it.cost=function(building){return function(){return building.amount>=Game.getAuraUnlockCost(building);}}(Game.ObjectsById[i-5]);
						it.buy=function(building){return function(){if (!decay.challengeStatus('comboOrbs')){building.sacrifice(Game.getAuraUnlockCost(building));}}}(Game.ObjectsById[i-5]);
					}
				}
			}
			Game.dragonLevels[Game.dragonLevels.length-3].cost = function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<Game.getBakeDragonCookieCost()) fail=1;}return (fail==0);}
			Game.dragonLevels[Game.dragonLevels.length-3].buy = function(){if (!decay.challengeStatus('comboOrbs')) { for (var i in Game.Objects){Game.Objects[i].sacrifice(Game.getBakeDragonCookieCost());} }Game.Unlock('Dragon cookie');}
			Game.dragonLevels[Game.dragonLevels.length-3].costStr = function(){return loc("%1 of every building",Game.getBakeDragonCookieCost());}
			Game.dragonLevels[Game.dragonLevels.length-2].cost = function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<Game.getDualwieldAuraCost()) fail=1;}return (fail==0);}
			Game.dragonLevels[Game.dragonLevels.length-2].buy = function(){if (!decay.challengeStatus('comboOrbs')) { for (var i in Game.Objects){Game.Objects[i].sacrifice(Game.getDualwieldAuraCost()); }}}
			Game.dragonLevels[Game.dragonLevels.length-2].costStr = function(){return loc("%1 of every building",Game.getDualwieldAuraCost());}
			addLoc('requires %1');
			eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace(`"sacrifice %1"`, `(decay.challengeStatus('comboOrbs')?'requires %1':'sacrifice %1')`));
		}

		Game.auraMult = function(what) {
			let n = 0;
			let a = decay.covenantStatus('aura');
			if (Game.dragonAuras[Game.dragonAura].name==what) { n += (a?1.5:1); } 
			else if (Game.dragonAuras[Game.dragonAura2].name==what) { n += (a?0.5:1); }
			if (Game.dragonAuras[Game.dragonAura].name=="Reality Bending") { n += (a?0.15:0.1); }
			else if (Game.dragonAuras[Game.dragonAura2].name=="Reality Bending") { n += (a?0.05:0.1); }
			return n;
		}

		eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace("price*=1-Game.auraMult('Master of the Armory')*0.02;","price*=1-Game.auraMult('Master of the Armory')*0.10;").replace(`Game.Has('Divine bakeries')) price/=5;`, `Game.Has('Divine bakeries')) { price/=5; } if (this.pool == 'cookie' && decay.challengeStatus('hc')) { price /= 2; }`));

		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("price*=1-Game.auraMult('Fierce Hoarder')*0.02;","price*=1-Game.auraMult('Fierce Hoarder')*0.05;"));

        //Dragon Cursor making all clicking buffs 50% stronger
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777);`,`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making CF stronger by 50%
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111);`,`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making DF stronger by 50%

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`list.push('blood frenzy','chain cookie','cookie storm');`,`{ list.push('blood frenzy','chain cookie','cookie storm'); for (let i = 0; i < randomFloor(Game.auraMult('Unholy Dominion') * 4); i++) { list.push('blood frenzy'); } }`));//Unholy Dominion pushes another EF to the pool making to so they are twice as common

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight');`,`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight'); for (let i = 0; i < randomFloor(Game.auraMult('Ancestral Metamorphosis') * 8); i++) { list.push('Ancestral Metamorphosis'); }`));//Adding custom effect for Ancestral Metamorphosis 

		addLoc('You discovered a'); addLoc('Dragon\'s hoard!'); addLoc('Collecting treasures...');
        eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`else if (choice=='blood frenzy')`,`else if (choice=='Ancestral Metamorphosis')
        {
			popup='<small>'+loc('You discovered a')+'</small><br>'+loc("Dragon\'s hoard!")+'<br><small>'+loc('Collecting treasures...')+'</small>';
   			decay.hoardT += decay.hoardTMax + 0.5 * Game.fps;
        }
		else if (choice=='trick or treat')
		{
		    buff=Game.gainBuff('trick or treat',Math.ceil(4*effectDurMod),4);
		}
		else if (choice=='lonely')
	    {
			if (Game.ObjectsById['1'].amount>0) { Game.ObjectsById['1'].sell(-1); popup=loc("Lonely.")+'<br><small>'+loc("All your grandmas left you!",loc("%1 All your grandmas and clones left you",))+'</small>'; }
			if (Game.ObjectsById['19'].amount>0) { Game.ObjectsById['19'].sell(-1); popup=loc("Lonely.")+'<br><small>'+loc("All your clones left you!",loc("%1 All your grandmas and clones left you",))+'</small>'; }
			if (Game.ObjectsById['1'].amount>0 && Game.ObjectsById['19'].amount>0) { Game.ObjectsById['19'].sell(-1); Game.ObjectsById['1'].sell(-1); popup=loc("Lonely.")+'<br><small>'+loc("All your grandmas and clones left you!",loc("%1 All your grandmas and clones left you",))+'</small>'; }

		}else if (choice=='blood frenzy')`));//When Ancestral Metamorphosis is selected it pushes a effect called Dragon's hoard that gives some amount of cookies in terms of cps
		Game.goldenCookieChoices.push('Dragon\'s hoard'); Game.goldenCookieChoices.push('Ancestral Metamorphosis');
		decay.hoardT = 0;
		decay.hoardTMax = 8 * Game.fps;
		decay.hoardTreasures = {
			t1: [
				'A batch of cookies!',
				'A batch of biscuits!',
				'A mound of chocolate!',
				'A handful of cookie dough!',
				'A bag of silver!',
				'A chest of bronze!',
				'A pit of dragon scales!',
				'A shiny stone!'
			],
			t2: [
				'A chest of gold!',
				'A well of silver!',
				'A pack of platinum!',
				'A bakery\'s worth of cookies!',
				'A bakery\'s worth of biscuit!',
				'A mountain of pure dark chocolate!',
				'A canyon of pure white chocolate!',
				'A mound of cookie dough!',
				'A dragon\'s blessing!',
				'A spring of fresh water!'
			],
			t3: [
				'Iridescent opal!',
				'Exquisite amber!',
				'Flawless ruby!',
				'Intricate jade!',
				'Vivid amethyst!',
				'Lustrous emerald!',
				'Brilliant sapphire!',
				'Gleaming golden pearl!',
				'A whole room of gold!',
				'A whole pool of platinum!',
				'A wedding ring!'
			],
			t4: [
				'A perfectly baked cookie!',
				'A perfect diamond!',
				'A key to a mysterious vault!',
				'A map of other treasures!',
				'A magnificant palace!'
			]
		};
		for (let i in decay.hoardTreasures) {
			for (let ii in decay.hoardTreasures[i]) {
				addLoc(decay.hoardTreasures[i][ii]);
				decay.hoardTreasures[i][ii] = loc(decay.hoardTreasures[i][ii]);
			}
		}
		decay.treasureChance = function(frac) {
			//chance that a treasure appears on any given tick
			return Math.max(0, (Math.sin(4 * frac)) - Math.cos(3 * frac) + frac / 10) / 5;
		}
		decay.checkHoard = function() {
			if (!decay.hoardT) { return; }
			decay.hoardT--;
			const mult = (Game.Has('Dragon fang')?1.1:1) * Game.goldenGainMult();
			if (Math.random() < decay.treasureChance(Math.min(decay.hoardT / decay.hoardTMax, 1))) {
				//summons a hoard treasure
				const n = Math.random();
				let str = '';
				let val = 0;
				let offsetX = 0;
				let offsetY = 0;
				if (n < 0.75) {
					val = Math.min(Game.cookiesPs * 60 * (1 + Math.random() * 2), Game.cookies * 0.01) * mult;
					str = choose(decay.hoardTreasures.t1);
					offsetX = (Math.random() - 0.5) * 150;
					offsetY = (Math.random() - 0.5) * 150 + 75;
				} else if (n < 0.925) {
					val = Math.min(Game.cookiesPs * 60 * (3 + Math.random() * 3), Game.cookies * 0.02) * mult;
					str = choose(decay.hoardTreasures.t2);
					offsetX = (Math.random() - 0.5) * 300;
					offsetY = (Math.random() - 0.5) * 300 + 75;
				} else {
					val = Math.min(Game.cookiesPs * 60 * (30 + Math.random() * 15), Game.cookies * 0.05) * mult;
					str = choose(decay.hoardTreasures.t3);
					offsetX = (Math.random() - 0.5) * 400;
					offsetY = (Math.random() - 0.5) * 400 + 75;
				}
				Game.Popup(str+'<br><small>'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</small>', Game.mouseX+offsetX, Game.mouseY+offsetY);
				Game.Earn(val);
			}
			if (decay.hoardT == 0) {
				const val = Math.min(Game.cookiesPs * 60 * 60 * 2, Game.cookies * 0.15) * mult;
				Game.Popup('<small>'+loc('At last, you find:')+'</small><br>'+choose(decay.hoardTreasures.t4)+'<br><small>'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</small>', Game.mouseX, Game.mouseY);
				Game.Earn(val);
			}
		}
		Game.registerHook('logic', decay.checkHoard);
		if (l('devConsoleContent')) {
			let hoardDiv = document.createElement('a');
			hoardDiv.classList.add('option');
			hoardDiv.classList.add('neato');
			AddEvent(hoardDiv, 'click', function() { var newShimmer=new Game.shimmer('golden');newShimmer.force='Ancestral Metamorphosis'; });
			hoardDiv.innerHTML = 'Dragon\'s hoard';
			l('devConsoleContent').appendChild(hoardDiv);
		}
		addLoc(`Dragon harvest, Dragonflight, and Dragon's hoard are <b>%1% stronger</b>.`);
		replaceDesc('Dragon fang', loc("Golden cookies give <b>%1%</b> more cookies.",3)+'<br>'+loc("Dragon harvest, Dragonflight, and Dragon's hoard are <b>%1% stronger</b>.",10)+'<br>'+loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.",10)+'<q>Just a fallen baby tooth your dragon wanted you to have, as a gift.<br>It might be smaller than an adult tooth, but it\'s still frighteningly sharp - and displays some awe-inspiring cavities, which you might expect from a creature made out of sweets.</q>');
		
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace(`m*=1-Game.auraMult('Arcane Aura')*0.05;`, `m*=((1 + Game.auraMult('Arcane Aura') * 1.25) - Game.auraMult('Arcane Aura') * 1.25 * Math.pow(0.975, Math.log(Math.min(1, decay.gen)) / Math.log(0.9)));`));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace(`if (Game.hasBuff('Sugar blessing')) m*=0.9;`, `if (Game.hasBuff('Sugar blessing')) { m*=0.9; } m*=((1 + Game.auraMult('Master of the Armory') * 0.6) - Game.auraMult('Master of the Armory') * 0.6 * Math.pow(0.99, Math.log(Math.max(1, decay.gen)) / Math.log(1.02)));`));
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`Game.ToggleSpecialMenu(1);`, `if (!decay.gameCan.interactDragon) { decay.gameCan.interactDragon = true; Game.ToggleSpecialMenu(1); decay.gameCan.interactDragon = false; } else { Game.ToggleSpecialMenu(1); } decay.setRates();`).replace('="Game.UpgradeDragon();"', '="if (!decay.gameCan.interactDragon) { decay.gameCan.interactDragon = true; Game.UpgradeDragon(); decay.gameCan.interactDragon = false; } else { Game.UpgradeDragon(); }"'));
		
		//auraDesc(1, "Kittens are <b>2.5%</b> more effective.", 'Aura: kittens are 2.5% more effective');
        auraDesc(2, Game.dragonAuras[2].desc+'<br>'+"Click frenzy and Dragonflight is <b>50%</b> more powerful.", 'Aura: greatly boosted Click frenzy & Dragonflight');
		auraDesc(4, Game.dragonAuras[4].desc+'<br>'+"Changes: increased trigger chance")
		auraDesc(5, Game.dragonAuras[5].desc+'<br>'+"Selling buildings partially <b>halts decay</b> based on the square root of the amount of buildings sold.", 'Aura: selling buildings halt decay');
		auraDesc(6, "Get <b>1%</b> (multiplicative) closer to <b>+60%</b> golden cookie frequency for each <b>x1.02</b> CpS multiplier from your purity.<br>(Note: this effect reduces the initial amount of time on Golden cookie click)", 'Aura: golden cookie frequency buff based on purity');
		auraDesc(7, "While not purifying decay, you accumulate <b>purification power</b> that will be spent in the next purification; the banked purification power is kept even when this aura is off.", 'Aura: passively accumulate purification power');
        auraDesc(8, "<b>+40%</b> prestige level effect and potential.", 'Aura: +40% prestige level effect and potential');
		auraDesc(9, "Get <b>2.5%</b> (multiplicative) closer to <b>+125%</b> Golden cookie frequency for each <b>x0.9</b> CpS multiplier from your decay.<br>(Note: this effect reduces the initial amount of time on Golden cookie click)", 'Aura: great golden cookie frequency buff based on decay');
		auraDesc(10, Game.dragonAuras[10].desc+'<br>'+"Changes: increased trigger chance scaling with the amount of golden cookie buffs existing, can never stack with Click frenzy")
        auraDesc(11, "Golden cookies may trigger a <b>Dragon\'s hoard</b>.", 'Aura: golden cookies may trigger a Dragon\'s hoard');
		auraDesc(12, "Elder frenzy from Wrath cookies appear <b>4x as often</b>.", 'Aura: 4x Elder frenzy chance from Wrath cookies');
		auraDesc(13, "Having purity now makes positive buffs run out slower, for up to <b>-50%</b> buff duration decrease rate.", 'Aura: purity decreases buff duration decrease rate');
        //auraDesc(15, "All cookie production <b>multiplied by 1.5</b>.", 'Aura: all cookie production multiplied by 1.5');
		auraDesc(16, Game.dragonAuras[16].desc+'<br>'+"Each reflective blessing counts as one-thirds of a golden cookie.", );
		auraDesc(17, "Selling buildings has a <b>1 in 100,000</b> chance to summon a lump-carrying wrinkler per building sold.", 'Aura: sell buildings to summon lump wrinklers');
		auraDesc(21, "Clicking on the big cookie knock back <b>all</b> wrinklers slightly, but excessive use in a short amount of time may lead to reduced effectiveness.", 'Aura: global wrinkler knockback on click');

		decay.dragonGutsKBMeter = 0;
		decay.dragonGutsKBMeterMax = 0.2;
		decay.dragonGutsKBRegenPerSec = 0.008 * 0.75; //0.75 cps maximum
		decay.dragonGutsUses = 0;
		decay.dragonGutsParticleTemplate = {
			width: 48,
			height: 48,
			scaleX: 0.1,
			scaleY: 0.1,
			scope: 'left',
			expandSpeedMult: 1,
			behaviors: new Crumbs.behaviorInstance(function() {
				this.scaleX += 2.25 * this.expandSpeedMult / Game.fps;
				this.scaleY += 2.25 * this.expandSpeedMult / Game.fps;
				this.alpha -= 1.6 / Game.fps;
				if (this.alpha <= 0) { this.die(); }
			}),
			order: 0.5,
			imgs: ['icons.png'],
			sx: 35 * 48,
			sy: 25 * 48
		}
		Game.registerHook('click', function() {
			if (decay.dragonGutsKBMeter >= decay.dragonGutsKBMeterMax * Game.auraMult('Dragon Guts')) { return; }
			let allWrinklers = Crumbs.getObjects('w', 'left');
			decay.dragonGutsKBMeter += 0.005 * Game.auraMult('Dragon Guts');
			for (let i in allWrinklers) {
				allWrinklers[i].dist += 0.005 * Game.auraMult('Dragon Guts');
			}
			decay.dragonGutsUses++;
			Crumbs.spawnVisible(decay.dragonGutsParticleTemplate, {
				x: Game.mouseX,
				y: Game.mouseY,
				expandSpeedMult: Game.auraMult('Dragon Guts'),
				rotation: decay.dragonGutsUses * Math.PI / 15
			});
		});
		Game.registerHook('logic', function() {
			decay.dragonGutsKBMeter = Math.max(decay.dragonGutsKBMeter - decay.dragonGutsKBRegenPerSec / Game.fps * Math.max(Game.auraMult('Dragon Guts'), 1), 0);
		});

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('for (var i=0;i<n;i++){mult*=1+auraMult*1.23;}', 'for (let i in Game.shimmers) { if (Game.shimmers[i].type != "golden") { continue; } mult *= Math.pow(1 + auraMult * 1.23, Game.shimmers[i].force == "reflective blessing"?(1 / 3):1) }'))
		
		allValues('auras');

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<0.8) Game.killBuff('Click frenzy');`,`Game.killBuff('Click frenzy');`));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`Game.ObjectsById[obj].amount/10+1;`,`Game.ObjectsById[obj].amount/20;`));

        //Buffing biscuit prices
		var butterBiscuitMult=100000000;

        Game.Upgrades['Milk chocolate butter biscuit'].basePrice=999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Dark chocolate butter biscuit'].basePrice=999999999999999999999999999999*butterBiscuitMult
        Game.Upgrades['White chocolate butter biscuit'].basePrice=999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Ruby chocolate butter biscuit'].basePrice=999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Lavender chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Synthetic chocolate green honey butter biscuit'].basePrice=999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Royal raspberry chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Ultra-concentrated high-energy chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Pure pitch-black chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Cosmic chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Butter biscuit (with butter)'].basePrice=999999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Everybutter biscuit'].basePrice=999999999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Personal biscuit'].basePrice=999999999999999999999999999999999999999999999999999999999999999*butterBiscuitMult

		allValues('upgrades rework');

		/*
		decay.getNews = function() {
			var newList = [];
			var name = Game.bakeryName;
			//add your new messages here

			if (!EN) { return []; }

			if (decay.incMult > 0.05) {
                newList = newList.concat([
                    'News: Decay rates spreading linked to global warming, says expert.'
                ]);
            }


			if (Game.Objects['Cursor'].amount>25) { newList = newList.concat([
				'News: Why are the cursors getting so big? What is the meaning of this?'
			]); }
			if (Game.Objects['Cursor'].amount>50) { newList = newList.concat([
				'News: what if, instead of having more fingers, we just made them click harder?',
				'News: cookies and cursors-storing warehouses found to be made of 99.8% fingers and 0.2% cookies, causing massive riots.'
			]); }
			if (Game.Objects['Cursor'].amount>100) { newList = newList.concat([
				'News: new "Million fingered" variety Cursors found to be the cause of death for several infants!',
				'News: finger-cutting jobs open for hire! Starting rate at fingers per hour!'
			]); }

			var grand = Game.Objects['Grandma'].amount;
			if (Game.Objects['Grandma'].amount>25) { newList = newList.concat([
				'News: analysis shows a possible type of grandmas opposite to that of normal grandmas, just like antimatter. Experts have coined it "grandpas".',
				'News: analysis shows that every year, on average, each grandma is getting '+Beautify(1 + Math.pow(grand, 2) * Game.Has('One mind') + Math.pow(grand, 4) * Game.Has('Communal brainsweep') + Math.pow(grand, 7) * Game.Has('Elder Pact'))+'% bigger.'
			]); }
			if (Game.Objects['Grandma'].amount>50) { newList = newList.concat([
				'AMBER ALERT: GRANDMA GONE MISSING. REPORT ANY POSSIBLE SIGHTINGS OF GRANDMA "'+choose(Game.grandmaNames).toUpperCase()+'" TO THE LOCAL AUTHORITY.',
				'SCIENTIFIC BREAKTHROUGH! Our top scientists just discovered that each grandma ages 1 year per year!',
				'News: the elders are rioting and are destroying a nearby factory!'
			]); }
			if (Game.Objects['Grandma'].amount>100) { newList = newList.concat([
				'<i>"No."</i><sig>grandma</sig>',
				'<i>"It is not our fault."</i><sig>grandma</sig>',
			]); }

			if (Game.Objects['Farm'].amount>0) newList = newList.concat([
				'News: local cookie manufacturer grows "Mother of beets"; Farmers outraged by root entanglement strategy.',
				'News: Maniac spurts about "Pizza": locals confused, it sounds like a giant red cookie.'
			]);
			if (Game.Objects['Farm'].amount>25) { newList = newList.concat([
				'News: a new law has been introduced that limited the stem length of all cookie plants to a maximum of 1 Ãƒâ€šÃ‚Âµm.',
				'News: local cookie manufacturer have started using the sun to grow cookie plants.'
			]); }
			if (Game.Objects['Farm'].amount>50) { newList = newList.concat([
				'News: storage out of control! Cookie plants are dying after a recent invasion of cookies that broke through the greenhouse roof; officials blame the warehouse construction company.'
			]); }
			if (Game.Objects['Farm'].amount>100) { newList = newList.concat([
				'News: experts suggest that cookies from cookie plants are unsafe to eat if not heated to at least 6,000,000 celsius.',
				'News: farmers report difficulty distinguishing between the cookies on the cookie plants and all the cookies around them.',
				'News: another farmer dies from suffocation.'
			]); }

			if (Game.Objects['Mine'].amount>25) { newList = newList.concat([
				'News: interdimensional portals within cookie mineshafts have been discovered that leads to "Earth". The mineshaft is now permanently closed.'
			]); }
			if (Game.Objects['Mine'].amount>50) { newList = newList.concat([
				'News: cookie mineshafts are closing up in order to become storage for the ever-growing pile of cookies.'
			]); }
			if (Game.Objects['Mine'].amount>100) { newList = newList.concat([
				'News: I\'m not sure what\'s in those underground tunnels, it\'s not like those tunnels are mine.'
			]); }

			if (Game.Objects['Factory'].amount>25) { newList = newList.concat([
				'News: your Factories are now producing as much as cookies as before.',
				'News: competitor involved in destroying equipment scandal.'
			]); }
			if (Game.Objects['Factory'].amount>50) { newList = newList.concat([
				'News: Factories going awry after the mechanical failure of the cookie output, factory now filled with cookies & possibly will become a cookie volcano in the next hour!'
			]); }
			if (Game.Objects['Factory'].amount>100) { newList = newList.concat([
				'News: new legislation suggests that all cookie-producing Factories be repurposed to '+(Game.Objects['Factory'].amount>250?'planet':'warehouse')+'-producing factories.'
			]); }

			if (Game.Objects['Bank'].amount>25) { newList = newList.concat([
				'News: economists worldwide predict imminent economic collapse, saying that "if cookie prices ever drop below 1e-'+Math.floor(Math.max(Game.log10Cookies - 2, 0))+'..."'
			]); }
			if (Game.Objects['Bank'].amount>50) { newList = newList.concat([
				'News: it currently costs 10 cookies to store 3 cookies. Because of this, your banks are closing up.',
				'News: man invades bank, finds gold. We still have hope.'
			]); }
			if (Game.Objects['Bank'].amount>100) { newList = newList.concat([
				'News: IN THIS ECONOMY??',
				'News: stock prices reach record highs after the destruction of the Great Space Cookie Patch! Traders hail in delight!'
			]); }

			if (Game.Objects['Temple'].amount>25) { newList = newList.concat([
				'News: are cookies real for gods? We sure hope not.',
				'News: local temple swamped after recent cookie containment breach! Airstrikes currently being called in.'
			]); }
			if (Game.Objects['Temple'].amount>50) { newList = newList.concat([
				'News: if cookies are not real for gods, then who are we praying to?'
			]); }
			if (Game.Objects['Temple'].amount>100) { newList = newList.concat([
				'News: construction company founded to be "insane" after the construction of the 5899th statue of a wrinkled isosceles triangle!'
			]); }

			if (Game.Objects['Wizard tower'].amount>25) { newList = newList.concat([
				'News: thermodynamics-adhering houses found to be the cause of the recent decay decrease!'
			]); }
			if (Game.Objects['Wizard tower'].amount>50) { newList = newList.concat([
				'News: spell "stretch time" forbidden after recent causality-breaking event!',
				'News: do you like magic? If yes, we advise that you turn yourself in immediately.'
			]); }
			if (Game.Objects['Wizard tower'].amount>100) { newList = newList.concat([
				'News: seems like we are out of magic. Experts advise removing wizard towers, but we suspect ulterior motivations.'
			]); }

			if (Game.Objects['Shipment'].amount>25) { newList = newList.concat([
				'News: spaceship implodes, evidence suggest that cookies are at fault! Investigation is currently being terminated and amnesticized.'
			]); }
			if (Game.Objects['Shipment'].amount>50) { newList = newList.concat([
				'News: your shipment #'+Math.floor(Math.random() * 1234565+2)+' has just discovered yet another star burning on cookie fusion!'
			]); }
			if (Game.Objects['Shipment'].amount>100) { newList = newList.concat([
				'News: the cookie transportation company is working hard to bring your cookies as far away as possible.'
			]); }

			if (Game.Objects['Alchemy lab'].amount>25) { newList = newList.concat([
				'News: cookie-friendly metal such as Einsteinium and Technetium found to be 100% more efficient at cookie-metal conversion!'
			]); }
			if (Game.Objects['Alchemy lab'].amount>50) { newList = newList.concat([
				'News: alchemy lab awarded the Nobel Peace Prize after being found to convert cookies back into gold!'
			]); }
			if (Game.Objects['Alchemy lab'].amount>100) { newList = newList.concat([
				'News: price of gold drops by 90% after the cookie-inflation catastrophe!'
			]); }

			if (Game.Objects['Portal'].amount>25) { newList = newList.concat([
				'News: today we bring you an Elderspeak podcast about cookie pollution.'
			]); }
			if (Game.Objects['Portal'].amount>50) { newList = newList.concat([
				'News: your portals are brimming with ungodly energy far better than anything your cookies could smell like!',
				'News: experts debate about sending cookies through portals, concludes that "the cookies will just return stronger than before."'
			]); }
			if (Game.Objects['Portal'].amount>100) { newList = newList.concat([
				'News: closing portals require matter, but why should that matter?'
			]); }

			if (Game.Objects['Time machine'].amount>25) { newList = newList.concat([
				'News: is it possible to send cookies to the future? Experts debate about the potential risks carried by time-centralized cookie storage.'
			]); }
			if (Game.Objects['Time machine'].amount>50) { newList = newList.concat([
				'News: cookies from the past "20% more edible and 50% less prone to spontaneous rebellion", claims world-renowned cookie manufacturer.'
			]); }
			if (Game.Objects['Time machine'].amount>100) { newList = newList.concat([
				'News: statistical analysis of cookies shows that "cookies sent to the future tend to be 1% less powerful"!'
			]); }

			if (Game.Objects['Antimatter condenser'].amount>25) { newList = newList.concat([
				'News: As it turns out, there is 1e200,405,192,204 times more antimatter than matter. Expert found cause to be "dimensions", whatever that means.',
				'News: Experts advise against turning antimatter to cookies, reason being "there is already way too much cookies, and antimatter can help clear out some cookies"'
			]); }
			if (Game.Objects['Antimatter condenser'].amount>50) { newList = newList.concat([
				'News: if there is so much cookies, why are there so few anticookies?'
			]); }
			if (Game.Objects['Antimatter condenser'].amount>100) { newList = newList.concat([
				'[news destroyed by antimatter]',
				'?secnetnesitna eht era erehw ,secnetnes hcum os si ereht fi :sewN'
			]); }

			if (Game.Objects['Prism'].amount>25) { newList = newList.concat([
				'News: Prisms are starting to exclusively use gamma rays to produce the smallest cookies possible.'
			]); }
			if (Game.Objects['Prism'].amount>50) { newList = newList.concat([
				'News: Prisms encounter issues outputting light, found cause to be cookies blocking the window! Officials will drop the next nuke tomorrow at 5:30, hopefully that\'ll clear it up a bit more.'
			]); }
			if (Game.Objects['Prism'].amount>100) { newList = newList.concat([
				'News: new evidence suggesting the origins of the universe turns out to be false, muddled by the complete lack of light which had all been converted to cookies!'
			]); }

			if (Game.Objects['Chancemaker'].amount>25) { newList = newList.concat([
				'News: it is considered lucky if the Chancemakers don\'t produce any cookies.'
			]); }
			if (Game.Objects['Chancemaker'].amount>50) { newList = newList.concat([
				'News: experts are considering the "quantom dislocation" optimization, wonders if the Chancemakers are powerful enough to dislocate a mass of cookies of 1,123,901,284 light years cubed.'
			]); }
			if (Game.Objects['Chancemaker'].amount>100) { newList = newList.concat([
				'News: you will see this news because RNG said yes.',
				'News: are the decorative eyeballs really necessary? Experts consider removing one eyeball from each Chancemaker to save space to store more cookies.'
			]); }

			if (Game.Objects['Fractal engine'].amount>25) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. '
			]); }
			if (Game.Objects['Fractal engine'].amount>50) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. ',
				'News: Fractal engines are encountering difficulty replicating. Experts are working hard to figure out where they are amongst the mass of cookies.'
			]); }
			if (Game.Objects['Fractal engine'].amount>100) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. Wait, we also can\'t?',
				'News: No, Fractal engines can\'t replicate into a larger copy of itself, either.'
			]); }

			var characters = ['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m','1','2','3','4','5','6','7','8','9','0','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'];
			var r = function(num) {
				var str = '';
				for (let i = 0; i < num; i++) {
					str += choose(characters);
				}
				return str;
			}

			if (Game.Objects['Javascript console'].amount>25) { newList = newList.concat([
				'News: if (me.when == "change code") { console.log(NaN); }',
				'News: programmers complain that they "can\'t see a thing" after using the new "all-natural sunlight" displays.'
			]); }
			if (Game.Objects['Javascript console'].amount>50) { newList = newList.concat([
				'News: this code is too unsightreadable.',
				'undefined',
				'News: '+r(Math.floor(Math.random() * 70) + 1)
			]); }
			if (Game.Objects['Javascript console'].amount>100 && Game.Objects['Time machine'].amount > 0) { newList = newList.concat([
				'News: price of LED skyrockets with the introduction of 1e18 x 1.8e18 wide screens.',
				'News: is it really necessary to write code with indent size 8?',
				'News: the source of the Great Cookie Space Patch has been attributed to the overuse of Javascript Consoles that take up too much space.'
			]); }

			if (Game.Objects['Idleverse'].amount>25) { newList = newList.concat([
				'News: experts question the appropriateness of the name "Idleverse", suggesting that they should be renamed to "Activeverse".'
			]); }
			if (Game.Objects['Idleverse'].amount>50) { newList = newList.concat([
				'News: Idleverses are being employed as bowling bulbs in recreational facilities. "Where else would you put them?" rhetorically-questions officials.'
			]); }
			if (Game.Objects['Idleverse'].amount>100 && Game.Objects['Time machine'].amount > 0) { newList = newList.concat([
				'News: experts suggest removing at least '+Math.floor(Game.Objects['Idleverse'].amount / 2)+' Idleverses after a catastrophic Idleverse Chained XK-Collapse scenario. '+name+', being the great baker, simply reverses time. "This will only happen again," warn experts from across universes.',
				'News: are Idleverses even worth keeping? Or should we remove some, so we can have more space to store cookies?',
				'News: scientists within Idleverses predict a Big Crunch to their universes. '
			]); }

		    if (Game.Objects['Cortex baker'].amount>0) { newList = newList.concat([
				'News: Cortex baker implodes, unknown plant puzzles blamed.',
				'News: it was discovered that thoughts can have thoughts and conclude "that is a tought thing to think"'
			]); }
			if (Game.Objects['Cortex baker'].amount>25) { newList = newList.concat([
				'News: You have a big brain.'
			]); }
			if (Game.Objects['Cortex baker'].amount>50) { newList = newList.concat([
				'News: "Cortex baker galaxy" can be seen during astronomical twilight.',
				'News: ordinary people found to have seizures after being in the presence of Cortex bakers for more than 1.5 microseconds. Due to space being clogged with wrinkly cookies, officials have no choice but to let them remain near people.'
			]); }

			if (Game.Objects['Cortex baker'].amount>100) { newList = newList.concat([
				'News: "The mass" Cortex baker cluster 3d9cjk reaches a record high of 1,204,589 congealed Cortex bakers! Experts suggest separating each Cortex Baker by at least 1 more kilometer; officials won\'t budge.',
				'News: Cortex bakers question the morality of thinking cookies into other Cortex bakers; advised to "keep working" even if there is nowhere else to put the cookies.'
			]); }

			if (Game.Objects['You'].amount>25) { newList = newList.concat([
				'News: local baker "'+name+'" and clones found to be the cause of at least 52,603 human rights violations; 99% of which are due to poor ventilation and overcrowding.',
				'News: '+name+'\'s clones are found to be harmful to philosophy.'
			]); }
			if (Game.Objects['You'].amount>50) { newList = newList.concat([
				'News: Who am I? Where did I come from? Where will I go?',
				'News: man founded to be "insane" after claiming that he likes cookies! We hope that this man gets at least a death sentence.'
			]); }
			if (Game.Objects['You'].amount>100) { newList = newList.concat([
				'News: '+name+'\'s clones are beginning to shrink. Experts expect nuclear fusion to occur in the next 4 hours.'
			]); }

			if (Game.Objects['Wizard tower'].level>10) newList.push(choose([
				'News: local baker levels wizard towers past level 10, disowned by family.'
			]));
			if (Game.Objects['Wizard tower'].level>15) newList.push(choose([
				'News: legendary baker levels wizard towers past level 15, left on the streets.'
			]));

			var buildNewList = [];

			if (Math.random() < 0.4) { buildNewList = buildNewList.concat(newList); }

			newList = [];
			var specials = [
				'News: can we unclick the cookie? Please?',
				'News: can we unbake the cookies? Please?',
				'News: can we bury all the cookies? Please?',
				'News: can we re-fossilize the cookies? Please?',
				'News: can we recycle the cookies? Please?',
				'News: can we pop the cookie bubble? Please?',
				'News: can we stop believing in cookies? Please?',
				'News: can we vanquish the cookies in magic? Please?',
				'News: can we return the cookies back to where they were? Please?',
				'News: can we turn the cookies back into gold? Please?',
				'News: can we throw all the cookies back into portals? Please?',
				'News: can we dispose the cookies into the future? Please?',
				'News: can we turn the cookies back into antimatter? Please?',
				'News: can we turn the cookies back into light? Please?',
				'News: can we chancemaker-ourselves a lack of cookies? Please?',
				'News: can we fractalize the cookies into infinitely many pieces? Please?',
				'News: can we remove the "cookies" feature? Please?',
				'News: can we stuff all our cookies back into the parallel universes? Please?',
				'News: can we render all our cookies into philosophy? Please?',
				'News: can we trace all our cookies back into a single owner? I think we can.'
			];
			if (Math.random() < 0.15) { for (let i in Game.Objects) {
				if (Game.Objects[i].amount > 500 - Game.Objects[i].id * 25) { newList.push(specials[Game.Objects[i].id]); }
			} }

			if (Math.random() < 0.1) { buildNewList = buildNewList.concat(newList); }

			if (Math.random()<0.001)
            {
                newList.push('<q>'+"JS is the best coding language."+'</q><sig>'+"no one"+'</sig>');
				newList.push('News: aleph reference REAL!');
				newList.push('News: "Say NO to ecm!" said protester.');
				newList.push('News: person called "rice" fails to execute a "combo", whatever that is.');
				newList.push('News: ticker broken, please insert another click.');
            }
            if (Math.random()<0.01 && decay.unlocked)
            {  
                newList.push('News: ascend at 365.');
				newList.push('News: Gone too far, or not enough? Protests rising against "intense competition for seemingly boring stuff."');
				newList.push('News: it was discovered that the '+name+' is actually a-');
				newList.push('News: Cookie Hermits think of new recipes, locals are shocked: "Taste like grass."');
				newList.push('News: crazed citizen quits job and leaves family to "grind ascends."');
				if (Game.Has('Cookie egg')) newList.push('<q>'+"Give me food master."+'</q><sig>'+"krumblor"+'</sig>');
				newList.push('News: ancient hieroglyphs deciphered to resemble 365 cookies of a heavenly origin. "We\'re not sure what that means," ponder scientists.');
				newList.push('News: local news stations overrun by suggestions: "Didnt know modding was this annoying."');
                newList.push('News: you should grail.');
				newList.push('News: encyclopaedia\'s head editor denies allegations that he is a ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œdaddyÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, says to the public ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œstop calling me thatÃƒÂ¢Ã¢â€šÂ¬Ã‚Â.');
				newList.push('News: hybrid human still keeps to the tradition of calling the head editor "daddy", refuses to take bribes.');
				newList.push('News: time manipulation growing old for the fiercely competitive baker industry, researchers pursue ways of the future by predicting ahead. "Everything is pre-determined, if you think about it."');
				if ((Game.AchievementsOwned==622)) newList.push('News: you did it, you can go outside now.');
				newList.push('News: "check the pins" crowned the phrase of the year!');
				newList.push('nEWS: aLL CAPITAL LETTERS REVERSED IN FREAK MAGIC ACCIDENT!');
				newList.push('News: Modders make "custom news tickers", public baffled at thought of corruption in the news.');
				newList.push('News: News: Words Words doubled doubled after after player player purchases purchases a a tiered tiered upgrade upgrade');
				newList.push('News: 8 disappearances reported in the past minute, officials blame mysterious "white vans" besides "empty fields with weird plants".');
				newList.push('News: vote for Green Yeast Digestives!');
				newList.push('News: vote for Hardtack!');
				if (Game.season == 'fools') { newList.push('Do not use business day. It has a chance to give a useless buff from all golden cookies, which makes stacking more than one buff naturally worse than it would be for any other non-christmas non-valentines season. Don\'t use business day.'); }
				if (Game.season == 'fools') { newList.push('News: A season is active. But what could it possibly be?'); }
				newList.push('News: spell "stretch time" forbidden after recent leaderboard-breaking event!');
				newList.push('News: are cookie quantum? World-leading baker '+name+' will bring you a possible explanation in this episode of...');
				newList.push('News: it\'s said that the same news ticker message won\'t strike the same place twice. Or will it?');
				newList.push('News: apologies, it appears that the last news had a typo. Here\'s the correct version: "'+replaceAll('"', "'", Game.addTypo(Game.lastTicker))+'"');
				newList.push('FIFI FOR MOD!!!!!');
				newList.push('News: "Tesseract" commits shadow-deletion wave after banning influential posters!');
				newList.push('The becoming of a grandmaster garden puzzler is a treacherous journey. First, one must prove themselves by completing many puzzles in the document leading up to the Grandmaster section. Then, they must take a test - consisting of 3 sections, which requires advanced speed solving, grandmaster solving, and puzzle creation, respectively. In the advanced speed solving section, one must solve all kinds of varieties of puzzles in as little as 30 minutes, from supermassives, to exploding portals, to proofs, and any combination thereof. In the grandmaster solve section, one must solve two very difficult puzzles in 2 hours - typically unknown plants, which is the undisputably most difficult variety by far, requiring one to find identities instead of solutions. Lastly, one must create 3 puzzles according to a theme, then be scored by the existing grandmasters. Only then will they realize the true meaning behind being a grandmaster.');
				newList.push('Hi Lookas, I\'m Lookas! Nice to meet my alt today!');
				newList.push('News: renowned orange cat, goober, is a good boy, with anyone else saying otherwise to be lying, new research finds.');
            }
			newList = newList.concat(buildNewList);
			return newList;
		}
		Game.registerHook('ticker', decay.getNews);

		Game.addTypo = function(m) {
			var i = Math.floor(Math.random() * m.length);
			if (!['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'].includes(m[i])) { return m.slice(0, i)+'#'+m.slice(i+1, m.length); }
			m = m.slice(0, i)+transmuteChar(m[i])+m.slice(i+1, m.length);
			return m;
		}

		Game.changeNews = function(message, newMessage) {
			eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(message, newMessage));
		}
		Game.removeNews = function(message, noComma) {
			var comma = ','; if (noComma) { comma = ''; }
			eval('Game.getNewTicker='+Game.getNewTicker.toString().replace("'"+message+"'"+comma,""));
		}

		decay.changeNews = function() {
			Game.removeNews('News : defective alchemy lab shut down, found to convert cookies to useless gold.');
			Game.removeNews('News : cookies slowly creeping up their way as a competitor to traditional currency!');
			Game.removeNews('News : cookie economy now strong enough to allow for massive vaults doubling as swimming pools!');
			Game.removeNews('News : space tourism booming as distant planets attract more bored millionaires!');
			Game.removeNews('News : defective alchemy lab shut down, found to convert cookies to useless gold.');
			Game.changeNews('News : first antimatter condenser successfully turned on, doesn\'t rip apart reality!', 'News: first antimatter condenser unsuccessfully turned on, ripped apart reality into a million pieces!');
			Game.changeNews('News : researchers conclude that what the cookie industry needs, first and foremost, is "more magnets".', 'News: researchers conclude that what the cookie industry needs, first and foremost, is "more suffering and agony".');
			Game.removeNews('News : cookies now being baked at the literal speed of light thanks to new prismatic contraptions.');
			Game.changeNews('News : all scratching tickets printed as winners, prompting national economy to crash and, against all odds, recover overnight.', 'News: all scratching tickets printed as winners, prompting the national economy to crash!');
			Game.removeNews('News: incredibly rare albino wrinkler on the brink of extinction poached by cookie-crazed pastry magnate!', true);
		}
		if (Game.ready) { decay.changeNews(); } else { Game.registerHook('create', decay.changeNews); }
		Game.overrideNews = function() {
			//returns news messages that will always override the intended output if the returned value isnt an empty array
			var list = [];
			if (Game.lastTicker == 'News: it\'s said that the same news ticker message won\'t strike the same place twice. Or will it?' && Math.random() < 0.5) { list.push('News: it\'s said that the same news ticker message won\'t strike the same place twice. Or will it?'); }
			return list; 
		}
		Game.lastTicker = '';
		eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(/News :/g, "News:").replace("Neeeeews :", "Neeeeews:").replace("Nws :", "Nws:").replace('Game.TickerEffect=0;', 'var ov = Game.overrideNews(); if (ov.length) { list = choose(ov); } Game.TickerEffect=0;').replace('Game.Ticker=choose(list);', 'Game.Ticker=choose(list); Game.lastTicker = Game.Ticker;'));

		allValues('news');
		*/

		/*=====================================================================================
        Power clicks
        =======================================================================================*/

		addLoc('Prestige effect x%1 for %2!');
		new Game.buffType('powerClick', function(time, pow, stack) {
			//pow here is a straight multiplier to cps and the inverse of which is the multiplier to decay propagation
			return {
				name:'Power poked',
				desc:loc('Prestige effect x%1 for %2!', [Beautify(pow, 2), Game.sayTime(time, -1)]),
				icon:[19, 7],
				time:time,
				power:pow,
				aura:1
			};
		});
		new Game.buffType('powerSurge', function(time) {
			return {
				name: 'Power surge',
				desc:loc('Your clicks become empowered by your power gauge!'),
				icon: [10, 1, kaizoCookies.images.custImg],
				time: time,
				aura: 0,
				max: true
			}
		});

		decay.power = 0;
		decay.firstPowerClickReq = 250;
		decay.powerClickScaling = 0.4;
		decay.powerClickReqs = [];
		decay.powerSurgeTime = 10 * Game.fps;
		decay.absPCMaxCapacity = 6;
		decay.PCCapacity = 1; //power click capacity
		decay.PCOnGCDuration = 1.3; //the effect of power clicks on golden cookie effect duration (multiplier)
		decay.PCMultOnClick = 10; //the multiplier to cookie gain on power click
		decay.powerLossLimit = 7200 * Game.fps; //amount of frames before power loss starts to happen
		decay.powerLossFactor = 0.33; //pow factor; the more this is the faster power loss happens
		decay.currentPC = 0; //updated every frame before draw, represents the amount of power clicks available
		decay.powerToNext = 0; //updated every frame before draw, represents the amount of remaining power required to get the next power click
		decay.totalPowerLimit = 0; //updated every frame before draw, represents the total amount of power it can hold
		decay.buildPowerClickReqs = function() {
			decay.powerClickReqs = [];
			var total = 0;
			var num = decay.firstPowerClickReq;
			for (let i = 0; i < decay.absPCMaxCapacity; i++) {
				total += num; 
				decay.powerClickReqs.push(total);
				num += decay.powerClickScaling * decay.firstPowerClickReq;
			}
			decay.totalPowerLimit = decay.powerClickReqs[decay.PCCapacity - 1];
		}
		decay.recalcPCCapacity = function() {
			var base = 1;
			if (Game.Has('Angels')) { base++; }
			if (Game.Has('Cherubim')) { base++; }
			if (Game.Has('God')) { base += 2; }
			return base;
		}
		decay.loadPowerClicks = function() {
			//contains all the functions to call right after loading in 
			decay.buildPowerClickReqs();
			decay.PCCapacity = decay.recalcPCCapacity();
		} 
		Game.registerHook('check', decay.loadPowerClicks);
		decay.loadPowerClicks();
		decay.spendPowerClick = function() {
			//decreases power as if a power click is used
			decay.tryUpdateTable = true;
			if (decay.power < decay.powerClickReqs[0]) { return false; }
			if (decay.power < decay.powerClickReqs[1]) { decay.power = (decay.power - decay.powerClickReqs[0]) / (decay.powerClickReqs[1] - decay.powerClickReqs[0]) * decay.powerClickReqs[0]; return true; }
			decay.times.sincePowerClick = 0; //so that gc clicks also work
			for (let i = 0; i < decay.powerClickReqs.length; i++) {
				if (decay.powerClickReqs[i] > decay.power) { decay.power = decay.powerClickReqs[i - 2] + (decay.power - decay.powerClickReqs[i - 1]) / (decay.powerClickReqs[i] - decay.powerClickReqs[i - 1]) * (decay.powerClickReqs[i - 1] - decay.powerClickReqs[i - 2]); return true; } 
				else if (decay.powerClickReqs[i] == decay.power) { decay.power = decay.powerClickReqs[i - 1]; return true; }
			}
			decay.power = decay.totalPowerLimit; return true;
		}
		decay.getPowerPokedDuration = function() {
			var base = 20;
			//if (decay.challengeStatus('power')) { base *= 1.5; }
			if (Game.Has('Ichor syrup')) { base *= 1.07; }
			if (Game.Has('Fern tea')) { base *= 1.03; }
			if (Game.Has('Fortune #102')) { base *= 1.1; }
			if (Game.Has('Asmodeus')) { base *= 1.5; }
			
			return base * Game.fps;
		}
		decay.getPowerSurgeDur = function() {
			var base = 10;
			if (decay.isConditional('power')) { base /= decay.acceleration; }
			if (Game.Has('Ichor syrup')) { base *= 1.07; }
			if (Game.Has('Fern tea')) { base *= 1.03; }
			if (Game.Has('Fortune #102')) { base *= 1.1; }

			return base * Game.fps;
		}
		decay.powerPokedStack = 0;
		decay.rainbowCycleFull = [
			//https://cssgradient.io
			[255, 0, 0],
			[255, 154, 0],
			[208, 222, 33],
			[79, 220, 74],
			[63, 218, 216],
			[47, 201, 226],
			[28, 127, 238],
			[95, 21, 242],
			[186, 12, 248],
			[251, 7, 217]
		];
		addLoc('The duration of Power poked and Power surge <b>+%1%</b>.');
		replaceDesc('Ichor syrup', loc('The duration of Power poked and Power surge <b>+%1%</b>.', 7)+'<br>'+loc("Sugar lumps mature <b>%1</b> sooner.",Game.sayTime(7*60*Game.fps))+'<br>'+loc("Dropped by %1 plants.",loc("Ichorpuff").toLowerCase())+'<q>Tastes like candy. The smell is another story.</q>');
		replaceDesc('Fern tea', loc('The duration of Power poked and Power surge <b>+%1%</b>.', 3)+'<br>'+loc("Dropped by %1 plants.",loc("Drowsyfern").toLowerCase())+'<q>A chemically complex natural beverage, this soothing concoction has been used by mathematicians to solve equations in their sleep.</q>');
		replaceDesc('Fortune #102', loc('The duration of Power poked and Power surge <b>+%1%</b>.', 10)+'<br>'+'<q>Help, I\'m trapped in a '+(App?'computer':'browser')+' game!</q>');
		decay.halts['powerClick'] = new decay.haltChannelGroup(loc('Power clicks'));
		addLoc('Power click base');
		decay.halts['powerClickBase'] = new decay.haltChannel({
			properName: loc('Power click base'),
			keep: 100,
			overtimeLimit: 1000,
			overtimeEfficiency: 1,
			power: 0.3,
			decMult: 0.2
		});
		decay.powerClickHaltParameters = {
			autoExpire: true,
			keep: 0,
			halt: 1,
			power: 0.7,
			decMult: 0.2
		}
		decay.performPowerClick = function() {
			//function is specifically for activating on clicking big cookie, not anything else
			if (!Game.Has('Mammon')) { return; }

			if (decay.powerPokedStack < decay.PCCapacity) {
				let channel = new decay.haltChannel(decay.powerClickHaltParameters);
				channel.halt = (decay.halts.powerClick.channels.length?decay.halts.powerClick.channels[decay.halts.powerClick.channels.length - 1].halt:0) + 6 * ((decay.isConditional('power'))?0.25:1);
				decay.halts.powerClick.addChannel(channel);
				decay.stop(channel.halt * 0.01, 'powerClickBase');
			}
			const originalStack = decay.powerPokedStack;
			decay.powerPokedStack = Math.max(decay.halts.powerClick.channels.length, Game.hasBuff('Power poked')?Game.hasBuff('Power poked').arg2:0);

			for (let i = 0; i < randomFloor((1 + Math.random() * 0.25) * (25 + 10 * decay.powerPokedStack)); i++) {
				const xd = (Math.random() * 10 - 5);
				const yd = -(Math.random() * 6 - 1);
				if (Math.abs(xd) + Math.abs(yd) < 3) { continue; }
				Crumbs.spawnFallingCookie(0, 0, yd * (2 + decay.powerPokedStack * 0.4), xd * (1 + decay.powerPokedStack * 0.2), 6, null, true, 1, 2);
			}

			decay.bigCookieShockwave(30);

			if (Game.prefs.wobbly) { 
				Game.BigCookieSizeD *= 0.1;
				Game.BigCookieSizeD -= 0.5;
			}

			//Game.gainBuff('powerSurge', decay.getPowerSurgeDur());

			if (!Game.Has('Satan')) { return; }

			let power = 1.2;
			if (Game.Has('Lucifer')) { power += 0.25; }
			if (Game.Has('Chimera')) { power += 0.15; }
			let dur = decay.getPowerPokedDuration();
			if (Game.hasBuff('Power poked') && originalStack < decay.PCCapacity) {
				let buff = Game.hasBuff('Power poked');
				buff.time = Math.max(dur, buff.time + dur / 2);
				buff.power *= power;
				buff.arg1 *= power;
				//if (buff.arg2 >= 2) { decay.purifyAll(0.5 + buff.arg2 * 0.5, 1 - Math.pow(0.7, buff.arg2), 50); }
				buff.arg2 += 1;
				buff.desc = loc('Prestige effect x%1 for %2!', [Beautify(buff.arg1, 2), Game.sayTime(buff.time, -1)])
			} else if (originalStack < decay.PCCapacity) { 
				Game.gainBuff('powerClick', dur, power, 1); 
			}

			if (!Game.Has('Asmodeus')) { return; }

			const wList = Crumbs.getObjects('w', 'left');
			for (let i in wList) {
				if (wList[i].bomber && wList[i].dist <= 0) { continue; }
				wList[i].dist += 0.2 * (1 + Game.Has('Beelzebub') * 0.125);
				wList[i].hurt = Math.max(wList[i].hurt, 250);
				wList[i].findChild('wc').alpha = 0;
				wList[i].findChild('wc').t = Crumbs.t;
			}

			//if (Game.Has('Chimera') && decay.gen < 1) { halt *= 1 / Math.pow(decay.gen, 0.1); halt = Math.min(halt, 10); }
		}
		decay.performPowerWrinklerClick = function() {
			let baseDamage = 60;
			if (Game.Has('Beelzebub')) { baseDamage *= 1.5; }
			if (decay.challengeStatus('powerClickWrinklers')) { baseDamage *= 1.25; }

			decay.damageWrinkler.call(this, baseDamage * Game.log10Cookies * decay.getSpecialProtectMult.call(this), true, true);
			this.dist += 0.5;
			this.hurt += 200;

			for (let i = 0; i < 3; i++) { 
				Crumbs.spawn(decay.shockwaveTemplate, {
					x: this.scope.mouseX,
					y: this.scope.mouseY,
					imgUsing: Math.round(Math.random()),
					speedDecMult: 1,
					speed: 0 / Game.fps,
					speedInc: -2 / Game.fps,
					rotation: Math.random() * Math.PI,
					scaleX: 4 + i * 2,
					scaleY: 4 + i * 2,
					delay: i * 0.15 * Game.fps,
					alphaDecreaseRate: -2 / Game.fps,
					isFromPC: false,
					alpha: 0
				});
			}
			for (let i = 0; i < 2 + Game.Has('Belphegor') + Game.Has('Beelzebub'); i++) {
				Crumbs.spawn(decay.shockwaveTemplate, {
					x: this.scope.mouseX,
					y: this.scope.mouseY,
					rotation: Math.random() * Math.PI,
					imgUsing: Math.round(Math.random()),
					delay: i * 0.3 * Game.fps + 1 * Game.fps,
					damage: baseDamage,
					trigger: true
				});
			}

			decay.spawnWrinklerbits(this, 8, 3, 2, decay.wrinklerExplosionBitsFunc);

			return;
		}
		decay.shockwaveTemplate = {
			imgs: [kaizoCookies.images.heavenRing1Png, kaizoCookies.images.heavenRing2Png],
			speed: 50 / Game.fps,
			speedDecMult: 0.3,
			speedInc: 0 / Game.fps,
			alphaDecreaseRate: 0.75 / Game.fps,
			order: 20,
			delay: 0 * Game.fps,
			scaleX: 0,
			scaleY: 0,
			damage: 24,
			scope: 'left',
			trigger: false,
			isFromPC: true,
			radius: 0,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }),
			behaviors: new Crumbs.behaviorInstance(function() {
				if (this.delay == Math.round(-0.05 * Game.fps)) {
					if (this.trigger && this.damage) { decay.wrinklerShockwave(Crumbs.getObjects('w', 'left'), this.damage, this.x, this.y, this.radius, !this.isFromPC); }
					if (Game.Has('Thunder marker') && this.isFromPC) { 
						Crumbs.spawn(decay.shockwaveTemplate, {
							delay: 0.2 * Game.fps,
							speed: 7 / Game.fps,
							radius: 80,
							speedDecMult: 0.075,
							alphaDecreaseRate: 0.5 / Game.fps,
							x: decay.thunderMarkerObj.x,
							y: decay.thunderMarkerObj.y,
							isFromPC: false,
							trigger: true,
							rotation: Math.random() * Math.PI,
							imgUsing: Math.round(Math.random()),
							damage: this.damage * 1.5 * (1 + Game.Has('Pulsatic discharge') * 2 / 3)
						});
					} 
				}
				this.delay--;
				if (this.delay > 0) { return; }
				this.scaleX += this.speed;
				this.scaleY += this.speed;
				if (this.scaleX < 0) { this.die(); }
				this.speed += this.speedInc;
				this.speed *= Math.pow(this.speedDecMult, 1 / Game.fps);
				this.alpha -= this.alphaDecreaseRate;
				if (this.alpha <= 0) { this.die(); }
			})
		}
		decay.wrinklerBoundingPoints96 = [
			[50, 0],
			[49.936315990282864, 5.045530821873974],
			[49.74493857650445, 10.087831485467794],
			[49.42488430141489, 15.12359901501644],
			[48.97448939795417, 20.149380954230246],
			[48.39137161926096, 25.161490639990706],
			[47.672374398061706, 30.155909487265077],
			[46.81349078281022, 35.12816993398562],
			[45.80976361303478, 40.07321088796726],
			[44.65515729740939, 44.985194308511105],
			[43.34239529266413, 49.85726708492739],
			[41.86275608843384, 54.68124551179482],
			[40.20581954815536, 59.44718915007397],
			[38.3591557139013, 64.14281480935097],
			[36.30795162506183, 68.75267700365333],
			[34.034583273601015, 73.2570035257331],
			[31.518170255870547, 77.6300185166011],
			[28.73422333453785, 81.83750752218448],
			[25.654662048665145, 85.83328760262606],
			[22.248841378133953, 89.55420832837805],
			[18.486948889121248, 92.91356673319603],
			[14.348312631114476, 95.79406922434814],
			[9.838055165894275, 98.04514614304618],
			[5.012481745680001, 99.49623162209159],
			[0, 100],
			[-5.012481745683541, 99.49623162209087],
			[-9.83805516589722, 98.045146143045],
			[-14.348312631117247, 95.79406922434647],
			[-18.48694888912369, 92.9135667331941],
			[-22.248841378136035, 89.55420832837598],
			[-25.654662048667305, 85.83328760262349],
			[-28.73422333453977, 81.83750752218178],
			[-31.518170255872164, 77.63001851659847],
			[-34.0345832736027, 73.25700352572998],
			[-36.307951625063346, 68.75267700365013],
			[-38.35915571390277, 64.14281480934744],
			[-40.205819548156676, 59.447189150070436],
			[-41.86275608843495, 54.681245511791424],
			[-43.34239529266506, 49.85726708492418],
			[-44.655157297410106, 44.985194308508255],
			[-45.80976361303526, 40.0732108879651],
			[-46.81349078281066, 35.12816993398329],
			[-47.672374398062075, 30.155909487262715],
			[-48.391371619261264, 25.161490639988372],
			[-48.97448939795439, 20.14938095422807],
			[-49.42488430141507, 15.123599015014157],
			[-49.74493857650458, 10.087831485465317],
			[-49.93631599028292, 5.045530821871636],
			[-50, 0],
			[-49.9363159902828, -5.045530821876225],
			[-49.74493857650435, -10.087831485469843],
			[-49.42488430141471, -15.123599015018874],
			[-48.974489397953924, -20.1493809542327],
			[-48.39137161926061, -25.161490639993417],
			[-47.672374398061216, -30.155909487268158],
			[-46.81349078280972, -35.128169933988254],
			[-45.80976361303399, -40.07321088797089],
			[-44.655157297408735, -44.98519430851371],
			[-43.342395292663454, -49.85726708492974],
			[-41.86275608843296, -54.68124551179754],
			[-40.20581954815447, -59.447189150076376],
			[-38.35915571390077, -64.14281480935222],
			[-36.307951625061335, -68.75267700365436],
			[-34.034583273601015, -73.2570035257331],
			[-31.518170255870448, -77.63001851660125],
			[-28.73422333453784, -81.83750752218451],
			[-25.65466204866506, -85.83328760262616],
			[-22.248841378133285, -89.55420832837872],
			[-18.486948889120143, -92.91356673319693],
			[-14.348312631113494, -95.79406922434873],
			[-9.838055165894454, -98.04514614304611],
			[-5.0124817456805815, -99.49623162209149],
			[0, -100],
			[5.0124817456818, -99.49623162209123],
			[9.838055165895787, -98.04514614304559],
			[14.348312631114668, -95.79406922434802],
			[18.48694888912095, -92.91356673319629],
			[22.248841378133747, -89.55420832837827],
			[25.654662048665465, -85.83328760262569],
			[28.734223334537965, -81.83750752218431],
			[31.51817025587047, -77.63001851660121],
			[34.034583273601115, -73.25700352573291],
			[36.30795162506185, -68.75267700365329],
			[38.359155713901316, -64.14281480935092],
			[40.20581954815513, -59.44718915007462],
			[41.86275608843354, -54.68124551179574],
			[43.34239529266398, -49.857267084927926],
			[44.655157297409446, -44.98519430851089],
			[45.809763613034555, -40.07321088796832],
			[46.81349078281003, -35.12816993398663],
			[47.67237439806154, -30.155909487266076],
			[48.39137161926082, -25.161490639991733],
			[48.97448939795413, -20.149380954230693],
			[49.42488430141483, -15.12359901501733],
			[49.74493857650444, -10.087831485468111],
			[49.93631599028284, -5.045530821874887]
		];
		decay.factorsOf96 = [2, 3, 4, 6, 8, 12, 16, 24, 48, 96];
		//get the rest of the possibilies by discarding nodes
			
		decay.wrinklerInDist = function(wrinkler, distS, originX, originY) {
			const rawPoints = 4 + Math.floor(Math.pow(wrinkler.size, 1.5));
			let pointsCheck = 0;
			let closest = Infinity;
			for (let i in decay.factorsOf96) {
				if (Math.abs(decay.factorsOf96[i] - rawPoints) < closest) {
					closest = Math.abs(decay.factorsOf96[i] - rawPoints);
					pointsCheck = decay.factorsOf96[i];
				}
			}
			const factor = Math.round(96 / pointsCheck);
			const [ox, oy] = Crumbs.h.rv(-wrinkler.rotation, 0, Crumbs.getPHeight(wrinkler) / 2); 
			const x = wrinkler.x + ox;
			const y = wrinkler.y + oy; //these work I think

			for (let i = 0; i < 96; i += factor) {
				let [xR, yR] = decay.wrinklerBoundingPoints96[i];
				xR *= wrinkler.scaleX;
				yR *= -wrinkler.scaleY;
				[xR, yR] = Crumbs.h.rv(-wrinkler.rotation, xR, yR);
				//Crumbs.spawnParticle({ img: 'glint.png', width: 20, height: 20, life: 1 }, x + xR, y + yR, 2, 1, 'left');
				xR += x - originX;
				yR += y - originY;
				if (xR * xR + yR * yR <= distS) { return true; }
			}

			return false;
		}
		/*decay.badTest = [];
		Crumbs.spawn({
			width: 100,
			height: 200,
			scaleX: 1.05,
			scaleY: 1.05,
			x: 300,
			y: 300,
			behaviors: function() {
				this.x = this.scope.mouseX;
				this.y = this.scope.mouseY;
				const x = this.x;
				const y = this.y;
				const originX = this.scope.l.offsetWidth / 2;
				const originY = this.scope.l.offsetHeight * 0.4;
				const pointsCheck = 16;
				const factor = Math.round(96 / pointsCheck);
				const distS = 128 * 128;
				this.rotation += 1 / Game.fps;
				//this.scaleX = Game.T % 100 / 100 + 0.5;
				//this.scaleY = Game.T % 100 / 100 + 0.5;
				decay.badTest = [];
				let c = false;
				for (let i = 0; i < 96; i += factor) {
					let [xR, yR] = decay.wrinklerBoundingPoints96[i];
					xR *= this.scaleX;
					yR *= -this.scaleY;
					[xR, yR] = Crumbs.h.rv(-this.rotation, xR, yR);
					xR += x - originX;
					yR += y - originY;
					decay.badTest.push([xR, yR]);
					if (xR * xR + yR * yR <= distS) { c = true; }
				}
				//c && console.log(c);
			},
			components: [new Crumbs.component.pointerInteractive({ boundingType: 'oval' }), new Crumbs.component.canvasManipulator({ function: function(m, ctx) { 
				const pointsCheck = 16;
				const factor = Math.round(96 / pointsCheck);
				for (let i = 0; i < 96; i += factor) {
					let [xR, yR] = decay.wrinklerBoundingPoints96[i];
					xR *= m.scaleX;
					yR *= -m.scaleY;
					//xR -= x;
					//yR -= y;
					//ctx.fillStyle = 'rgb('+(i / 96 * 255)+', '+(i / 96 * 255)+', '+(i / 96 * 255)+')';
					//ctx.fillRect(xR - 4, yR - 4, 8, 8);
				}
			} })],
			scope: 'left',
			order: 100,
		});
		Crumbs.spawn({
			components: [new Crumbs.component.canvasManipulator({ function: function(m, ctx) { 
				for (let i = 0; i < decay.badTest.length; i++) {
					const h = i * 6;
					ctx.fillStyle = 'rgb('+(h / 96 * 255)+', '+(h / 96 * 255)+', '+(h / 96 * 255)+')';
					ctx.fillRect(- 4 + decay.badTest[i][0], - 4 + decay.badTest[i][1], 8, 8);
				}
			} })],
			scope: 'left'
		});
		Crumbs.prefs.colliderDisplay = 1;*/
		decay.wrinklerShockwave = function(allWrinklersInput, baseDamage, originX, originY, radius, noKB) {
			let allWrinklers = [];
			if (!radius) { 
				allWrinklers = allWrinklersInput; 
			} else {
				for (let i in allWrinklersInput) {
					const w = allWrinklersInput[i];
					const pWidth = Crumbs.getPWidth(w);
					const pHeight = Crumbs.getPHeight(w);
					if (decay.wrinklerInDist(w, radius * radius, originX, originY) || Crumbs.h.inOval(originX - w.getTrueX(), originY - w.getTrueY(), pWidth / 2, pHeight / 2, Crumbs.getOffsetX(w.anchor, pWidth) - pWidth / 2, Crumbs.getOffsetY(w.anchor, pHeight) - pHeight / 2, w.getTrueRotation())) { allWrinklers.push(w); }
				}
			}
			for (let i in allWrinklers) {
				if (allWrinklers[i].phantom && !allWrinklers[i].vulnerability) { continue; }

				const specialMult = decay.getSpecialProtectMult.call(allWrinklers[i]);
				const prevSize = allWrinklers[i].size;
				if (allWrinklers[i] && !allWrinklers[i].dead && allWrinklers[i].size >= 0) { decay.damageWrinkler.call(allWrinklers[i], baseDamage * specialMult, false, 2); }
				if (!noKB) { 
					allWrinklers[i].dist += 0.03;
					if (Game.Has('Abaddon')) { allWrinklers[i].dist += 0.07; }
				}
				allWrinklers[i].hurt += 150 * (Game.Has('Eternal light') + 1);
				if (allWrinklers[i].size < prevSize) { decay.spawnWrinklerbits(allWrinklers[i], 4, 1.5, 1.5, decay.wrinklerExplosionBitsFunc, originX - allWrinklers[i].x, originY - allWrinklers[i].y); }
			}
		}
		decay.bigCookieShockwave = function(damage) {
			let o = {
				x: Crumbs.scopedCanvas.left.l.width / 2,
				y: Crumbs.scopedCanvas.left.l.height * 0.4,
				speed: 20 / Game.fps,
				speedDecMult: 0.3,
				alphaDecreaseRate: 0.4 / Game.fps,
				scaleX: 1,
				scaleY: 1,
				trigger: false,
				rotation: Math.random() * Math.PI,
				damage: damage,
				order: -0.1
			}
			Crumbs.spawn(decay.shockwaveTemplate, o);
			o.imgUsing = 1;
			o.rotation = Math.random() * Math.PI;
			o.speed = 15 / Game.fps;
			Crumbs.spawn(decay.shockwaveTemplate, o);
		}
		//thunder marker
		decay.thunderMarkerObj = Crumbs.spawn({
			id: 'thunderMarker',
			imgs: kaizoCookies.images.crosshair,
			scope: 'left',
			order: 12, 
			scaleX: 0.5,
			scaleY: 0.5,
			grabbed: false,
			enabled: false,
			behaviors: new Crumbs.behaviorInstance(function() {
				if (this.grabbed) { this.x = this.scope.mouseX; this.y = this.scope.mouseY; }
				if (Game.T < Game.fps) { return; }
				this.x = Math.min(Math.max(this.x, 0), this.scope.l.width);
				this.y = Math.min(Math.max(this.y, 0), this.scope.l.height);
				
				if (!Game.Has('Pulsatic discharge') || Game.TCount % (20 * Game.fps) !== 0) { return; }
				Crumbs.spawn(decay.shockwaveTemplate, {
					delay: 0.1 * Game.fps,
					speed: 5 / Game.fps,
					radius: 60,
					speedDecMult: 0.075,
					alphaDecreaseRate: 0.5 / Game.fps,
					x: this.x,
					y: this.y,
					isFromPC: false,
					trigger: true,
					rotation: Math.random() * Math.PI,
					imgUsing: Math.round(Math.random()),
					damage: 120
				});
			}),
			x: 100,
			y: 100,
			children: [{
				width: 32,
				height: 32,
				order: 15,
				components: new Crumbs.component.pointerInteractive({ boundingType: 'oval', onClick: function() { if (decay.grabbedObj.length) { return; } this.parent.grabbed = true; decay.grabbedObj.push(this.parent); }, onRelease: function() { this.parent.grabbed = false; if (decay.grabbedObj.includes(this.parent)) { decay.grabbedObj.splice(decay.grabbedObj.indexOf(this.parent), 1); } }}),
				behaviors: function() {
					//console.log(this.getComponent('pointerInteractive').hovered);
				}
			}]
		});
		decay.powerClickToLeftSectionSpeed = 1;
		decay.setSymptomsFromPowerClicks = function() {
			if (decay.times.sincePowerClick / Game.fps >= 4 * (1 + 0.6 * decay.powerPokedStack)) { return 1; }
			return 1 + Math.pow(Math.max(Math.min(4 * (1 + 0.6 * decay.powerPokedStack) - decay.times.sincePowerClick / Game.fps, 2 * (1 + 0.3 * decay.powerPokedStack)), 0), 0.5);
		}
		decay.getBigCookieSizeTModFromPC = function() {
			if (!decay.powerPokedStack) { return 1; }
			const p = Math.pow(Math.max(1 - (decay.times.sincePowerClick / Game.fps / 3), 0), 0.33) * (decay.powerPokedStack?(2 + 1 * decay.powerPokedStack):0);
			const t = Math.sin(Math.pow(decay.times.sincePowerClick / Game.fps * 100 * (1 + decay.powerPokedStack * 0.3), 0.6 + decay.powerPokedStack * 0.05));
			return Math.pow(0.97 + t * 0.05, p);
		}
		eval('Game.Logic='+Game.Logic.toString()
			.replace('Game.BigCookieSizeD+=(Game.BigCookieSizeT-Game.BigCookieSize)*0.75;', 'Game.BigCookieSizeT *= decay.getBigCookieSizeTModFromPC(); Game.BigCookieSizeD+=(Game.BigCookieSizeT-Game.BigCookieSize)*0.75;')
		);
		decay.PCOnBigCookie = function() {
			if (decay.powerClicksOn() && Game.Has('Mammon') && decay.spendPowerClick()) { decay.performPowerClick(); return 10; }
			return 1;
		}
		eval('Game.ClickCookie='+Game.ClickCookie.toString().replace(`var amount=amount?amount:Game.computedMouseCps;`, `var amount=amount?amount:Game.computedMouseCps; amount *= decay.PCOnBigCookie();`).replace(`(Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50))`, `(Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50) || !decay.gameCan.click || decay.grabbedObj.length)`));
		Game.rebuildBigCookieButton = function() {
			l('bigCookie').remove();
			var bigCookie = document.createElement('button');
			bigCookie.id = 'bigCookie';
			l('cookieAnchor').appendChild(bigCookie);
			if (Game.touchEvents) {
				AddEvent(bigCookie,'touchend',Game.ClickCookie);
				AddEvent(bigCookie,'touchstart',function(event){if (decay.gameCan.click) { Game.BigCookieState=1; } Game.bigCookieHovered = true; if (event) event.preventDefault();});
				AddEvent(bigCookie,'touchend',function(event){if (decay.gameCan.click) { Game.BigCookieState=0; } Game.bigCookieHovered = false; if (event) event.preventDefault();});
				AddEvent(bigCookie,'touchcancel',function(event) { Game.BigCookieState=0; Game.bigCookieHovered = false; if (event) event.preventDefault(); });
			} else {
				AddEvent(bigCookie,'click',Game.ClickCookie);
				AddEvent(bigCookie,'mousedown',function(event){if (decay.gameCan.click) { Game.BigCookieState=1; }if (Game.prefs.cookiesound) {Game.playCookieClickSound();}if (event) event.preventDefault();});
				AddEvent(bigCookie,'mouseup',function(event){if (decay.gameCan.click) { Game.BigCookieState=2; }if (event) event.preventDefault();});
				AddEvent(bigCookie,'mouseout',function(event){ Game.BigCookieState=0; Game.bigCookieHovered = false; });
				AddEvent(bigCookie,'mouseover',function(event){ Game.BigCookieState=2; Game.bigCookieHovered = true; });
			}
		}
		Game.bigCookieHovered = false;
		
		decay.hasPowerClicks = function() {
			return (decay.power >= decay.powerClickReqs[0]);
		}
		decay.powerClicksOn = function() {
			return Game.hasBuff('Power surge') && ((!decay.prefs.powerClickShiftReverse && !Game.keys[16]) || (decay.prefs.powerClickShiftReverse && Game.keys[16]));
		}
		//no decay.powerClick here for simplicity
		decay.tryUpdateTable = true;
		decay.updatePower = function() {
			decay.powerPokedStack = Math.max(decay.halts.powerClick.channels.length, Game.hasBuff('Power poked')?Game.hasBuff('Power poked').arg2:0);

			decay.updatePowerFragDest();

			var p = decay.power;
			var r = 0;
			for (let i = 0; i < decay.powerClickReqs.length; i++) {
				if (p < decay.powerClickReqs[i]) { r = i; break; }
			}
			if (p == decay.powerClickReqs[decay.powerClickReqs.length - 1]) { r = decay.powerClickReqs.length; }
			decay.currentPC = r;
			if (decay.powerClickReqs[r]) { decay.powerToNext = decay.powerClickReqs[r] - p; } else { decay.powerToNext = 1; }
			if (decay.tryUpdateTable) { decay.onPCChange(); decay.tryUpdateTable = false; }
			if (Game.hasBuff('Power poked')) { return; }
			if (decay.isConditional('power')) {
				var toGain = 2 + Math.sqrt(decay.currentPC + 1) * decay.acceleration * Math.pow(Math.max(decay.times.sincePowerClick / Game.fps - (20 / decay.acceleration), 1), 0.4) / Game.fps;
				if (decay.power != 0 && decay.powerToNext <= 0) { decay.tryUpdateTable = true; }
				decay.power += toGain;
				if (decay.power >= decay.totalPowerLimit) { decay.power = decay.totalPowerLimit; decay.forceAscend(false); }
				decay.power = Math.max(0, decay.power);
				return;
			}
			if (decay.times.sincePowerGain < decay.powerLossLimit) { return; }
			var toLose = Math.pow(Math.max(Math.min(decay.times.sincePowerGain, decay.times.sinceOrbClick, decay.times.sincePowerClick) - decay.powerLossLimit, 0), decay.powerLossFactor) / Game.fps;
			if (decay.power != 0 && decay.powerToNext + toLose > decay.powerClickReqs[decay.currentPC]) { decay.tryUpdateTable = true; }
			decay.power -= toLose;
			decay.power = Math.max(0, decay.power);
		}
		decay.powerUnlocked = function() {
			return Game.Has('Twin Gates of Transcendence');
		}
		decay.powerFragTemplate = {
			scope: 'left',
			imgs: [kaizoCookies.images.glow],
			dx: 0,
			dy: 0,
			scaleX: 0.3,
			scaleY: 0.3,
			order: 90,
			destination: {
				//singular object, no memory issues
				x: Crumbs.scopedCanvas.left.l.width - 40,
				y: Crumbs.scopedCanvas.left.l.height - 80
			},
			behaviors: new Crumbs.behavior(function() {
				this.dx *= Math.pow(0.1, 1 / Game.fps);
				this.dy *= Math.pow(0.1, 1 / Game.fps);
				const vMult = Math.pow(Math.min((Crumbs.t - this.t) / Game.fps * 1.5, 4), 8);
				const dxToDest = this.destination.x - this.x;
				const dyToDest = this.destination.y - this.y;
				const dist = Math.sqrt(dxToDest * dxToDest + dyToDest * dyToDest) || 1;
				this.dx += (dxToDest / dist) * vMult;
				this.dy += (dyToDest / dist) * vMult;
				this.x += this.dx;
				this.y += this.dy;

				if (this.x < 0) {
					this.x = 0;
					this.dx = 0.8 * -this.dx;
				}
				if (this.x > this.scope.l.width) {
					this.x = this.scope.l.width;
					this.dx = 0.8 * -this.dx;
				}
				if (this.y < 0) {
					this.y = 0;
					this.dy = 0.8 * -this.dy;
				}
				/*if (this.y > this.scope.l.height) {
					this.y = this.scope.l.height;
					this.dy = 0.8 * -this.dy;
				}*/
				
				if (this.x > this.destination.x && this.y > this.destination.y) {
					decay.actuallyGainPower(this.gainAmount);
					this.die();
				}
				/*
				const r2 = 200;
				const dx = this.dx;
				const dy = this.dy;
				const fx = (this.x - this.dx) - this.destination.x;
				const fy = (this.y - this.dy) - this.destination.y;

				const a = dx * dx + dy * dy;
				const b = 2 * (fx * dx + fy * dy);
				const c = fx * fx + fy * fy - r2;

				let discriminant = b * b - 4 * a * c;
				if (discriminant >= 0) {
					discriminant = Math.sqrt(discriminant);
					const t1 = (-b - discriminant) / (2 * a);
					const t2 = (-b + discriminant) / (2 * a);
					if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
						decay.actuallyGainPower(this.gainAmount); 
						this.die();
					}
				}*/
			}),
			gainAmount: 1
		}
		decay.updatePowerFragDest = function() { 
			decay.powerFragTemplate.destination.x = Crumbs.scopedCanvas.left.l.width - 20;
			decay.powerFragTemplate.destination.y = Crumbs.scopedCanvas.left.l.height - 50;
		}
		decay.powerFragQuantities = [1, 3, 5, 13, 37, 69]
		decay.powerFragQuantitiesRev = decay.powerFragQuantities.slice().reverse();
		decay.powerFragSizes = [0.01, 0.015, 0.025, 0.04, 0.06, 0.1]
		decay.gainPower = function(amount, x, y, dx, dy, mag) {
			mag = mag ?? 300;
			for (let i = 0; i < 50; i++) {
				if (amount < 1) { break; }
				const idx = Math.floor(Math.random() * (decay.powerFragQuantities.length - (decay.powerFragQuantitiesRev.findIndex(q => q <= amount) || decay.powerFragQuantities.length)));
				const a = decay.powerFragQuantities[idx];
				if (!a) { continue; }
				amount -= a;

				const angle = Math.PI * 2 * Math.random();
				const magnitude = Math.random() * mag / Game.fps;
				Crumbs.spawn(decay.powerFragTemplate, {
					gainAmount: a,
					scaleX: decay.powerFragSizes[idx],
					scaleY: decay.powerFragSizes[idx],
					x: (x || Crumbs.scopedCanvas.left.l.width * 0.5),
					y: (y || Crumbs.scopedCanvas.left.l.height * 0.4),
					dx: (dx || 0) + Math.cos(angle) * magnitude,
					dy: (dy || 0) + Math.sin(angle) * magnitude
				});
			}
			if (amount > 0) { decay.actuallyGainPower(amount); }
		}
		decay.actuallyGainPower = function(amount) {
			if (!decay.powerUnlocked()) { return; }
			amount *= decay.powerGainMult;
			decay.power = Math.min(decay.power + amount, decay.totalPowerLimit);
			decay.times.sincePowerGain = 0;
			if (decay.powerToNext - amount < 0) { decay.onPCChange(); }
		}
		decay.powerGainMult = 1;
		decay.setPowerGainMult = function() {
			let mult = 1;
			if (Game.Has('Archangels')) { mult *= 1.5; }
			if (Game.Has('Seraphim')) { mult *= 1 + decay.currentPC * 0.2; }
			if (decay.challengeStatus('power')) { mult *= 1.5; }
			if (decay.covenantStatus('powerGain')) { mult *= 1.25; }
			return mult;
		}
		decay.maxPowerAndAllowClicks = function() {
			decay.gainPower(1e5, Crumbs.scopedCanvas.left.l.width * 0.5, Crumbs.scopedCanvas.left.l.height * 0.4, 0, 0, 400 + 400 * decay.soulClaimPowerFragMagnitudeMultiplier);
			Game.gainBuff('powerSurge', 10000000);
		}
		
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("this.last=choice;","this.last=choice;  var powerClick=false; if (decay.powerClicksOn() && decay.hasPowerClicks() && Game.Has('Chimera')) { decay.spendPowerClick(); powerClick=true; PlaySound('snd/powerShimmer.mp3',0.4); PlaySound('snd/powerClick'+choose([1,2,3])+'b.mp3',0.7-Math.random()*0.3); }"));

		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("else mult*=Game.eff('wrathCookieGain');","else mult*=Game.eff('wrathCookieGain'); if (powerClick) { effectDurMod*=decay.PCOnGCDuration; mult*=decay.PCOnGCDuration*50; } "));		
	
		replaceDesc('Twin Gates of Transcendence', 'Adds the <b>power gauge</b> once decay is unlocked. Power clicks can be used to obliterate one wrinkler and deal massive damage to all other wrinklers.<q>There\'s plenty of knowledgeable people up here, and you\'ve been given some excellent pointers.</q>');
		//Game.Upgrades['Twin Gates of Transcendence'].dname="Power clicks"; moved to after upgrade localization
		addLoc('Power clicks');
		addLoc('This is your power gauge, representing the amount of power clicks you have as well as the amount of power you will need to get to your next power click.');
		Game.Upgrades['Twin Gates of Transcendence'].icon = [23, 2, kaizoCookies.images.custImg];
		replaceDesc('Angels', 'Maximum power click capacity increased to <b>2</b>.<q>Lowest-ranking at the first sphere of pastry heaven, angels are tasked with delivering new recipes to the mortals they deem worthy.</q>');
		Game.Upgrades['Angels'].basePrice *= 7**1;
		replaceDesc('Archangels', 'You gain <b>50%</b> more power.<q>Members of the first sphere of pastry heaven, archangels are responsible for the smooth functioning of the world\'s largest bakeries.</q>');
		Game.Upgrades['Archangels'].basePrice *= 7**2;
		replaceDesc('Virtues', 'Unlocks the <b>Boundless sack</b>, allowing to summon power orbs at will.<q>Found at the second sphere of pastry heaven, virtues make use of their heavenly strength to push and drag the stars of the cosmos.</q>');
		Game.Upgrades['Virtues'].basePrice *= 7**3;
		replaceDesc('Dominions', 'Power orbs spawn <b>50%</b> more often and you deal <b>50%</b> more damage to them.<q>Ruling over the second sphere of pastry heaven, dominions hold a managerial position and are in charge of accounting and regulating schedules.</q>');
		Game.Upgrades['Dominions'].basePrice *= 7**4;
		replaceDesc('Cherubim', 'Maximum power click capacity increased to <b>3</b>, and makes purifying decay also grant power.<q>Sieging at the first sphere of pastry heaven, the four-faced cherubim serve as heavenly bouncers and bodyguards.</q>');
		Game.Upgrades['Cherubim'].basePrice *= 7**5;
		replaceDesc('Seraphim', 'You gain <b>20%</b> more power for each full power click you have stored.<q>Leading the first sphere of pastry heaven, seraphim possess ultimate knowledge of everything pertaining to baking.</q>');
		Game.Upgrades['Seraphim'].basePrice *= 7**6;
		replaceDesc('God', 'Maximum power click capacity increased to <b>5</b>.<q>Like Santa, but less fun.</q>');
		Game.Upgrades['God'].basePrice *= 7**7;
		replaceDesc('Belphegor', 'The shockwave from power clicking wrinklers repeats <b>one more time</b>.<q>A demon of shortcuts and laziness, Belphegor commands machines to do work in his stead.</q>');
		Game.Upgrades['Belphegor'].basePrice *= 7**1;
		replaceDesc('Mammon', 'You can perform power clicks on the big cookie as well, which stops decay for an <b>extended</b> period of time with each activation being considered a <b>distinct method</b>.<q>The demonic embodiment of wealth, Mammon requests a tithe of blood and gold from all his worshippers.</q>');
		Game.Upgrades['Mammon'].basePrice *= 7**2;
        replaceDesc('Abaddon', 'The shockwave from power clicking wrinklers also <b>knocks back</b> all wrinklers hit.<q>Master of overindulgence, Abaddon governs the wrinkler brood and inspires their insatiability.</q>');
		Game.Upgrades['Abaddon'].basePrice *= 7**3;
		replaceDesc('Satan', 'Power clicking the big cookie renders it "Power poked", boosting prestige effect by <b>+20%</b> for <b>20 seconds</b> (strength stacks with each use) as well as preventing fatigue from building up while power poked.<q>The counterpoint to everything righteous, this demon represents the nefarious influence of deceit and temptation.</q>');
		Game.Upgrades['Satan'].basePrice *= 7**4;
		replaceDesc('Asmodeus', 'Power poked effect lasts <b>50%</b> longer, and clicking on the big cookie <b>knocks back</b> all wrinklers <b>even more</b>.<q>This demon with three monstrous heads draws his power from the all-consuming desire for cookies and all things sweet.</q>');
		Game.Upgrades['Asmodeus'].basePrice *= 7**5;
		replaceDesc('Beelzebub', 'Wrinkler click shockwaves trigger <b>one more time</b> and power clicking wrinklers deal <b>50%</b> more damage.<q>The festering incarnation of blight and disease, Beelzebub rules over the vast armies of pastry inferno.</q>');
		Game.Upgrades['Beelzebub'].basePrice *= 7**6;

		replaceDesc('Lucifer', 'Power poked effect increased to <b>+45%</b> prestige effect.<q>Also known as the Lightbringer, this infernal prince\'s tremendous ego caused him to be cast down from pastry heaven.</q>');
		Game.Upgrades['Lucifer'].basePrice *= 7**7;
		replaceDesc('Chimera', 'Allows power clicks to be done on golden cookies, which increases its effect duration by <b>30%</b>.<br>Power poked buff increases prestige effect by another <b>15%</b>.<q>More than the sum of its parts.</q>');
		Game.Upgrades['Chimera'].basePrice *= 7**6;
		Game.Upgrades['Synergies Vol. I'].basePrice = 22222222;
		Game.Upgrades['Synergies Vol. II'].basePrice = 222222222222;
		Game.Upgrades['Kitten angels'].basePrice *= 100;
		Game.Upgrades['Diabetica Daemonicus'].parents.splice(1, 1);

		injectCSS('.verticalMeterContainer { background: rgba(0, 0, 0, 0.25); border-radius: 2px; position: absolute; right: 0px; bottom: -96px; right: -30px; margin-left: -10px; border-image:url(img/frameBorder.png) 3 round; border-style: solid; border-width: 10px; z-index: 10; width: 100px; height: 350px; transform: scale(0.3); }');
		injectCSS('.verticalMeter { width: 100%; position: absolute; bottom: 0px; background: url("'+kaizoCookies.images.powerGradientBlue+'");}');
		injectCSS('.powerTableContainer { width: 100%; height: 100%; z-index: 5; position: absolute; }');
		injectCSS('.powerGlow { text-shadow:0px -4px 8px rgba(240, 156, 255, 0.75),0px 3px 6px rgba(88, 185, 255, 0.8),0px 0px 3px rgba(255, 255, 255, 0.2); font-weight: bold; color: #fff; z-index: 2; position: absolute; top: 50%; left: 50%; font-size: 72px; transform: translate(-50%, -50%); }');
		injectCSS('.powerTable { width: 100%; height: 100%; }');
		injectCSS('.ptcell { border: 4px solid rgb(64, 64, 64);  }');
		injectCSS('.ptcol { width: 100%; }');
		decay.createPowerGauge = function() {
			var PGDiv = document.createElement('div');
			PGDiv.classList.add('verticalMeterContainer');
			PGDiv.id = 'powerGauge';
			PGDiv.style.display = 'none';
			var fill = document.createElement('div');
			fill.classList.add('verticalMeter');
			fill.id = 'powerFill';
			var tableContainer = document.createElement('div');
			tableContainer.classList.add('powerTableContainer');
			var table = document.createElement('table');
			table.id = 'powerTable';
			table.classList.add('powerTable');
			tableContainer.appendChild(table);
			var num = document.createElement('div');
			num.id = 'powerNum';
			num.classList.add('powerGlow');
			PGDiv.appendChild(num);
			PGDiv.appendChild(fill);
			PGDiv.appendChild(tableContainer);
			l('sectionLeft').appendChild(PGDiv);
			
			decay.powerGaugeEle = l('powerGauge');
			AddEvent(decay.powerGaugeEle, 'mouseover', function() { if (Game.mouseDown) { return; } Game.tooltip.dynamic = 0; Game.setOnCrate(decay.powerGaugeEle); Game.tooltip.draw(decay.powerGaugeEle, escape('<div style="min-width:200px;text-align:center;font-size:11px;padding:5px;">'+loc('This is your power gauge, representing the amount of power clicks you have as well as the amount of power you will need to get to your next power click.')+'</div>'), 'top'); Game.tooltip.wobble(); });
			AddEvent(decay.powerGaugeEle, 'mouseout', function() { Game.setOnCrate(0); Game.tooltip.shouldHide=1; });
			decay.powerFillEle = l('powerFill');
			decay.powerNumEle = l('powerNum');
			decay.powerTableEle = l('powerTable');
			Game.rebuildBigCookieButton();
		}
		decay.setGaugeColor = function(imageRef) {
			decay.powerFillEle.style.background = 'url("'+kaizoCookies.images[imageRef]+'")';
		} 
		if (Game.ready) { decay.createPowerGauge(); decay.setGaugeColor('powerGradientBlue'); } else { Game.registerHook('create', decay.createPowerGauge); }
		decay.updatePowerGauge = function() { 
			if (!decay.powerUnlocked() || !decay.unlocked || Game.AscendTimer) { decay.powerGaugeEle.style.display = 'none'; return; }
			decay.powerGaugeEle.style.display = '';
			var total = decay.powerClickReqs[decay.currentPC];
			if (decay.currentPC > 0) { total -= decay.powerClickReqs[decay.currentPC - 1]; }
			decay.powerNumEle.innerHTML = decay.currentPC.toString(); 
			if (decay.currentPC >= decay.PCCapacity) { 
				decay.powerFillEle.style.height = '100%';
				decay.setGaugeColor('powerGradientRed'); 
				return;
			}
			decay.setGaugeColor('powerGradientBlue');
			decay.powerFillEle.style.height = (100 * ((total - decay.powerToNext) / total)) + '%';
		}
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace(`l('specialPopup').innerHTML=str;`, `l('specialPopup').innerHTML=str; l('specialPopup').style.width = (decay.powerUnlocked()?320:350)+'px';`));
		//if (Game.ready && Game.specialTab) { var st = Game.specialTab; Game.ToggleSpecialMenu(false); Game.specialTab = st; Game.ToggleSpecialMenu(true); }
		decay.onPCChange = function() {
			var str = '';
			var total = decay.powerClickReqs[decay.currentPC];
			if (decay.currentPC > 0) { total -= decay.powerClickReqs[decay.currentPC - 1]; }
			var repeats = total / decay.powerClickReqs[0];
			for (let i = 1; i <= repeats; i++) {
				str += '<tr class="ptcell"><td class="ptcol"></td></tr>';
			}
			var remains = repeats - Math.floor(repeats);
			str = '<tr class="ptcell" style="height:'+((1 - (1 / repeats) * Math.floor(repeats)) * 100)+'%;"><td class="ptcol"></td></tr>' + str;
			decay.powerTableEle.innerHTML = str;
		}
		Game.registerHook('check', decay.onPCChange);

		decay.powerOrbEle = document.createElement('div');
		decay.powerOrbEle.id = 'powerOrbs';
		injectCSS('#powerOrbs { position: absolute; left; 0px; top: 0px; z-index:1000000000; }');
		l('game').appendChild(decay.powerOrbEle);
		injectCSS('.powerOrb { border: 4px solid; cursor: pointer; position: absolute; display: block; width: 32px; height: 32px; border-radius: 24px; }');
		injectCSS(`@keyframes rainbowCycleBorder {
			0% { border-color: #ff1d87; }
			16% { border-color: #a071ff; }
			33% { border-color: #40b9ff; }
			50% { border-color: #15ff57; }
			66% { border-color: #ffed29; }
			83% { border-color: #ff5f2e; }
			100% { border-color: #ff1d87; }
		}`);
		/*injectCSS(`@keyframes rainbowAnimation { 
            0% { background: radial-gradient(circle, #ff1d87, #a071ff, #40b9ff, #15ff57, #ffed29, #ff5f2e); }
			10% { background: radial-gradient(circle, #ff5f2e, #ff1d87, #a071ff, #40b9ff, #15ff57, #ffed29); }
			32% { background: radial-gradient(circle, #ffed29, #ff5f2e, #ff1d87, #a071ff, #40b9ff, #15ff57); }
			47% { background: radial-gradient(circle, #15ff57, #ffed29, #ff5f2e, #ff1d87, #a071ff, #40b9ff); }
			71% { background: radial-gradient(circle, #40b9ff, #15ff57, #ffed29, #ff5f2e, #ff1d87, #a071ff); }
			85% { background: radial-gradient(circle, #a071ff, #40b9ff, #15ff57, #ffed29, #ff5f2e, #ff1d87); }
			100% { background: radial-gradient(circle, #ff1d87, #a071ff, #40b9ff, #15ff57, #ffed29, #ff5f2e); }
		}`); doesnt work lmao s k u l l*/
		decay.getPowerOrbHP = function() {
			var base = 40;
			base *= 1 + Game.log10Cookies * 0.04;
			if (decay.isConditional('power')) { base *= 1.5; }
			return base;
		}
		decay.vector = function(x, y) {
			this.x = x||0;
			this.y = y||0;
		}
		decay.vector.prototype.magnitude = function(mult) {
			if (typeof mult !== 'undefined') {
				this.x *= mult;
				this.y *= mult;
			}
			return Math.sqrt(this.x*this.x, this.y*this.y);
		}
		decay.vector.prototype.multiply = function(mult) {
			this.x *= mult;
			this.y *= mult;
			return this;
		}
		decay.vectorAdd = function(v1, v2) {
			return new decay.vector(v1.x+v2.x, v1.y+v2.y);
		}
		decay.vector.prototype.add = function(v) {
			this.x += v.x;
			this.y += v.y;
		}
		decay.vector.prototype.copy = function() {
			return new decay.vector(this.x, this.y);
		}
		decay.vector.prototype.toPolar = function() {
			return [this.magnitude(), Math.atan2(-this.y, this.x)];
		}
		decay.vector.prototype.setPolar = function(input) {
			this.x = Math.cos(input[1]) * input[0];
			this.y = -Math.sin(input[1]) * input[0];
		}
		decay.vector.prototype.addPolar = function(input) {
			var v = new decay.vector();
			v.setPolar(input);
			return this.add(v);
		}
		decay.polar = function(mag, rad) {
			//NOT a replacement for vector, just a convenient tool to get a vector from polar
			var v = new decay.vector();
			v.setPolar([mag, rad]);
			return v;
		}
		decay.powerOrbs = [];
		decay.powerOrbsN = 0;
		decay.powerOrb = function(mirage) {
			this.hp = decay.getPowerOrbHP();
			this.hpMax = this.hp;
			this.x = Math.random() * l('game').offsetWidth;
			this.y = 0;
			this.size = 32; //px
			this.scale = 1; //mult
			this.scaleMult = 1; //mult to scale
			this.r = 0; //deg
			this.velocity = new decay.vector(0, 5);
			this.velToAdd = new decay.vector(0, 0);
			this.static = new decay.vector(); //not subject to friction and is reset to 0 every frame
			this.mode = '';
			/* possible modes: floating, jumpy, daring, teleporting, crazy */
			/* 
   			Floating: floats left and right, avoids cursor
   			Jumpy: occasionally gives velocity boost in a random direction (prefers left and right), jumps faster and stronger if cursor is near
	  		Daring: launches itself toward cursor, but also avoids cursor with a much stronger scaling as its distance closes; only available above half health
	  		Teleporting: very small movements but teleports to another position when cursor gets near; only available below half health
	 		Crazy: lasts very little time, but it just flings itself across the screen randomly with high bounce loss
	  		*/
			this.mirage = mirage ?? null; //how real it is
			/* if it is, replace with an object describing the mirage. If an orb is a mirage, it is unaffected by mode and instead takes on custom behavior indicated by the update property (function that takes in itself every frame)*/
			/* parameters: 
   			init: on instantiation
   			update: every frame
	  		die: on death
	 		onClick: on click
	  		*/
			if (this.mirage && this.mirage.init) { this.mirage.init(this); }

			this.fleeIn = 240 * Game.fps;

			this.simulating = true;
			this.bounceMode = 1; //0 is no bounce checking, 1 is normal bounce, 2 is wraparound (unimplemented)
			this.bounceLoss = 1;
			this.g = l('game');
			this.t = 0;
			this.t2 = 0;
			this.mouseDist2 = 0;
			this.mouseVector = new decay.vector(0, 0);
			this.times = {
				sinceLastClick: 0,
				sinceLastModeChange: 0,
				sinceLastJump: 0,
				sinceLastBounce: 0,
				sinceLastTeleport: 0
			};
			this.selected = false;
			this.nextModeIn = 0;
			this.frictionX = 1;
			this.frictionY = 1;
			if (!this.mirage) { this.changeMode('floating'); }
			
			this.l = document.createElement('div');
			this.l.classList.add('powerOrb');
			this.l.style.left = this.x + 'px';
			this.l.style.top = this.y + 'px';
			if (!this.mirage) { this.l.style.animation = 'rainbowCycleBG 37s ease infinite, rainbowCycleBorder 23s ease infinite'; }
			if (!Game.touchEvents) {AddEvent(this.l,'mousedown',function(what){return function(event){what.clickHandler(event);};}(this));}
			else {AddEvent(this.l,'touchend',function(what){return function(event){what.clickHandler(event);what.selected=false;};}(this));}//plagerism!!!
			if (!Game.touchEvents) {AddEvent(this.l,'mouseover',function(what){return function(event){if (what.selected && Game.mouseDown) { what.clickHandler(event); } };}(this));}
			else {AddEvent(this.l,'touchstart',function(what){return function(event){what.selected = true;};}(this));}
			//dont think touch events ever get used ever so like really cant be bothered to fix the not working code
			decay.powerOrbEle.appendChild(this.l);
			decay.powerOrbs.push(this);
			decay.powerOrbsN++;
			decay.clicksEligibleForPowerOrbs = 0;
		}
		decay.keyPressed = 0;
		AddEvent(document,'keydown',function(event){if (!decay.keyPressed && ((decay.prefs.touchpad && event.key.toLowerCase() == 'a') || event.key === ' ')) { decay.keyPressed = 1; for (let i in decay.powerOrbs) { if (decay.powerOrbs[i].selected) { decay.powerOrbs[i].clickHandler(); break; } } }});
		AddEvent(document,'keyup',function(){ decay.keyPressed = 0; });
		Game.registerHook('logic', function() { if (decay.keyPressed) { decay.keyPressed++; } if (decay.keyPressed > 1 * Game.fps) { decay.keyPressed = 0; } });

		decay.halts['powerOrb'] = new decay.haltChannel({
			properName: loc('Power orbs'),
			keep: 3,
			decMult: 0.2,
			tickspeedPow: 0.1,
			overtimeEfficiency: 0.1,
			overtimeLimit: 20,
			power: 0.9
		});
		decay.powerOrb.prototype.die = function() {
			if (decay.powerOrbs.indexOf(this)!=-1) { decay.powerOrbs.splice(decay.powerOrbs.indexOf(this), 1); }
			decay.powerOrbsN--;
			if (this.mirage) {
				if (this.mirage.die) { this.mirage.die(this); }
				this.l.remove();
				return;
			}
			Game.gainBuff('powerSurge', decay.getPowerSurgeDur());
			decay.stop(1, 'powerOrb');
			decay.tryStoreBoundlessSack(1);
			const size = this.size * this.scale;
			Crumbs.spawn(decay.soulClaimAuraTemplate, {
				behaviors: decay.soulClaimAuraBehaviorPure,
				x: this.x + size / 2,
				y: this.y + size / 2,
				scope: 'foreground',
				color: getComputedStyle(this.l).borderColor,
				currentSize: size / 2,
				currentWidth: 14 * this.scale,
				expandSpeed: 500 / Game.fps,
				thinningSpeed: 0.1 / Game.fps,
				expandFriction: 0.95,
				thinningAcceleration: 0.2 / Game.fps,
				afterimages: {
					behaviors: decay.soulClaimAuraBehaviorPure,
					x: this.x + size / 2,
					y: this.y + size / 2,
					scope: 'foreground',
					order: decay.soulClaimAuraTemplate.order - 1,
					thinningAcceleration: 2 / Game.fps,
					thinningSpeed: 6 / Game.fps,
					expandSpeed: 0 / Game.fps,
					color: getComputedStyle(this.l).backgroundColor
				},
				afterimageInterval: Game.fps / 5
			});
			this.l.remove();
			//decay.purifyAll(1.5, 0.5, 10);
		}
		decay.powerOrb.prototype.expire = function() {
			if (decay.powerOrbs.indexOf(this)!=-1) { decay.powerOrbs.splice(decay.powerOrbs.indexOf(this), 1); }
			this.l.remove();
			decay.powerOrbsN--;
		}
		decay.powerOrb.prototype.update = function() {
			//every non-draw frame because more consistency even tho realistically it makes 0 difference
			if (this.hp <= 0) {
				this.die();
			}
			
			var aX = this.x + this.size/2;
			var aY = this.y + this.size/2;
			this.static.multiply(0);
			
			this.t++; 
			this.mouseDist2 = Math.pow(Game.mouseX - aX, 2) + Math.pow(Game.mouseY - aY, 2);
			this.t2 += 1 + 5 / (1 + this.mouseDist2);
			this.mouseVector = new decay.vector(Game.mouseX - aX, Game.mouseY - aY);

			for (let i in this.times) { this.times[i]++; }
			this.fleeIn = Math.max(0, this.fleeIn - 1);
			if (this.fleeIn == 0 && this.y > this.g.offsetHeight * 0.8 && this.mode != 'fleeing') {
				this.changeMode('fleeing');
			}

			if (this.mirage) {
				if (this.mirage.update) { this.mirage.update(this); }
				return;
			}

			if (this.nextModeIn <= 0) {
				this.changeMode(this.selectMode());
			} 
			this.nextModeIn--; 
			this.regenerate();
			this.move(aX, aY);
			if (this.simulating) { this.simulate(); }
		}
		decay.powerOrb.prototype.regenerate = function() {
			//this.hp += (Math.min(Math.sqrt(Math.max(0, this.times.sinceLastClick - 12 * Game.fps)), 50) / 10) / Game.fps;
			if (Game.hasBuff('Haggler\'s misery')) { this.hp += 3 / Game.fps; }
			
			this.hp = Math.min(this.hp, this.hpMax);
		}
		decay.powerOrb.prototype.simulate = function() {
			this.velToAdd.multiply(Math.min(Game.deltaTime / (1000 / Game.fps), 3)); //latency compensator, which is actually quite important 
			this.velocity.add(this.velToAdd);
			this.velToAdd.multiply(0);
			
			//bouncing
			const size = this.size * this.scale * this.scaleMult;
			if (this.bounceMode == 1) {
				if (this.x + size + this.velocity.x >= this.g.offsetWidth) { this.onBounce(); this.velocity.x *= -this.bounceLoss; this.x = this.g.offsetWidth -= size; } 
				if (this.x + this.velocity.x <= 0) { this.onBounce(); this.velocity.x *= -this.bounceLoss; this.x = 0; }
				if (this.y + size + this.velocity.y >= this.g.offsetHeight) { this.onBounce(); this.velocity.y *= -this.bounceLoss; this.y = this.g.offsetHeight -= size; } //not gonna really bother with much here but ig it could be better
				if (this.y + this.velocity.y <= 0) { this.onBounce(); this.velocity.y *= -this.bounceLoss; this.y = 0; }
			}

			//friction
			if (this.times.sinceLastModeChange <= 5 * Game.fps) {
				const additionalFriction = (1 - 0.05 * (1 / Math.pow(this.times.sinceLastModeChange + 75, 0.25)));
				this.velocity.x *= additionalFriction;
				this.velocity.y *= additionalFriction;
			}
			this.velocity.x *= this.frictionX;
			this.velocity.y *= this.frictionY;

			//scaling
			this.scale = 1 + 0.5 * (1 - this.hp / this.hpMax);
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { this.scale *= 3; }
			if (decay.isConditional('power')) { this.scale *= 0.7; }
			if (this.times.sinceLastClick < 10 * Game.fps) {
				this.scale *= 1 - (0.75 - this.hp / this.hpMax * 0.6) * Math.sin((Math.pow(1 + this.times.sinceLastClick / Game.fps * 3, 0.05) - 1) * 300) / Math.pow(1 + this.times.sinceLastClick / Game.fps, 3);
			}

			//hagglers charm effect
			if (Game.hasBuff('Haggler\'s luck')) {
				let newVector = this.mouseVector.copy().toPolar();
				newVector[0] = Math.pow(newVector[0], 0.15);
				this.velocity.addPolar(newVector);
				this.scale *= 1.75;
			}
			if (decay.prefs.bigOrbs) {
				this.scale *= 1.6;
			}
			if (Game.hasBuff('Haggler\'s misery')) {
				this.velocity.multiply(3);
			}
			
			this.x += this.velocity.x + this.static.x;
			this.y += this.velocity.y + this.static.y;
		}
		decay.powerOrb.prototype.keepInBound = function() {
			this.x = Math.min(this.x, this.g.offsetWidth - this.size * this.scale * this.scaleMult); 
			this.x = Math.max(this.x, 0);
			this.y = Math.min(this.y, this.g.offsetHeight - this.size * this.scale * this.scaleMult); 
			this.y = Math.max(this.y, 0);
		}
		Game.sign = function(num) {
			if (num < 0) { return -1; } else if (num > 0) { return 1; } else { return 0; } //probably a better way to do this 
		}
		decay.powerOrb.prototype.move = function(aX, aY) {
			var vel = new decay.vector();
			const yFrac = 1 - this.y / this.g.offsetHeight;

			switch (this.mode) {
				case 'floating': 
					vel.setPolar([(Math.cos(this.t2 / 11)*2+4)/(3 * Math.log(this.mouseDist2 + 3)), (Math.sin(this.t2 / (25))+1)*Math.PI/2]);
					if (this.mouseVector.magnitude() <= 120) {
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = 1 / (1 + Math.sqrt(newVector[0]));
						newVector[0] *= -1 - 5 * Math.pow(1 / (this.times.sinceLastClick / Game.fps + 1), 0.5);
						vel.addPolar(newVector);
					}

					vel.add(new decay.vector(0, 0.02+yFrac*0.04)); //gravity
					break;
				case 'jumpy':
					var dist = this.times.sinceLastJump * (1 / (1 + Math.pow(this.mouseDist2, 0.15)));
					if (dist >= 10 && Math.random() < Math.pow(0.5, 6 / dist)) {
						this.times.sinceLastJump = 0;
						//jumps away from cursor
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = -5 - (Math.random() * 8);
						vel.addPolar(newVector);
						vel.addPolar([3, (Math.random() - 0.5) * Math.PI * 2]);
					}

					vel.add(new decay.vector(0, 0.02+yFrac*0.02)); //gravity
					break;
				case 'daring':
					var dist = this.times.sinceLastJump * (1 + Math.pow(this.mouseDist2, 0.1));
					if (dist >= 400 && Math.random() < Math.pow(0.5, 4000 / dist)) {
						this.times.sinceLastJump = 0;
						//jumps toward cursor
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = 8 + (Math.random() * 6) + 12 * (1 - 1 / (this.times.sinceLastClick / Game.fps + 1));
						vel.addPolar(newVector);
						vel.addPolar([3, (Math.random() - 0.5) * Math.PI * 2]);
					}
					if (this.mouseVector.magnitude() <= 180) {
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = 1 / (1 + Math.pow(newVector[0], 0.5));
						newVector[0] *= (1 / Math.pow(this.times.sinceLastJump + 1, 0.5)) * (-12 - 20 * Math.pow(1 / (this.times.sinceLastClick / Game.fps + 1), 0.5));
						vel.addPolar(newVector);
					}

					vel.add(new decay.vector(0, 0.04+yFrac*0.03)); //gravity
					break;
				case 'teleporting':
					if (this.times.sinceLastClick > 1 * Game.fps) { this.simulating = (this.times.sinceLastTeleport > 0.5 * Game.fps); } else { this.simulating = true; }
					this.scaleMult = Math.min(1, (this.times.sinceLastTeleport + 1) / (0.25 * Game.fps));

					if (this.times.sinceLastTeleport < 0.1 * Game.fps) { break; }
					var dist = Math.pow(this.mouseDist2, 0.5);
					if (dist >= 25 && dist < 150) {
						if (Math.random() < (dist - 25) / 150) { 
							decay.spawnTeleportMirage(this); 
							var nVel = new decay.vector();
							nVel.addPolar([300, Game.randomRad()]);
							var newVector = new decay.vector((this.g.offsetWidth / 2) - aX, (this.g.offsetHeight / 2) - aY);
							newVector = newVector.toPolar();
							newVector[0] = 75 + 50 * Math.random();
							nVel.addPolar(newVector);
							newVector = this.mouseVector.copy().toPolar();
							newVector[0] = -25 - (Math.random() * 20);
							nVel.addPolar(newVector);
	
							this.x += nVel.x;
							this.y += nVel.y;
							this.keepInBound();
							this.times.sinceLastTeleport = 0;
						}
					} else if (dist < 25) {
						decay.spawnTeleportMirage(this);
						var nVel = new decay.vector();
						nVel.addPolar([100, Game.randomRad()]);
						var newVector = new decay.vector((this.g.offsetWidth / 2) - aX, (this.g.offsetHeight / 2) - aY);
						newVector = newVector.toPolar();
						newVector[0] = 25 + 25 * Math.random();
						nVel.addPolar(newVector);
						newVector = this.mouseVector.copy().toPolar();
						newVector[0] = -15 - (Math.random() * 10);
						nVel.addPolar(newVector);

						this.x += nVel.x;
						this.y += nVel.y;
						this.keepInBound();
						this.times.sinceLastTeleport = 0;
					}
					break;
				case 'crazy':
					vel.setPolar([Math.cos(this.t / 7) * 4 + 5, Math.sin(this.t / 11) * Math.PI]);
					break;
				case 'fleeing':
					vel.add(new decay.vector(0, Math.max(-this.times.sinceLastModeChange / Game.fps / 2, -2)));
					if (this.y < 0 - 2 * aY) {
						this.expire();
					}
					if (Game.T % 3 == 0) { this.spawnAura(); }
					break;
			}

			vel.multiply(Math.min(1, 1.5 - Math.pow(this.hp / this.hpMax, 2))); //decreased momentum if above some health
			if (decay.prefs.slowOrbs) { vel.multiply(0.5); }
			this.velToAdd.add(vel);
		}
		Game.randomRad = function() {
			return Math.PI * 2 * (Math.random() - 0.5);
		}
		decay.teleportMirageObj = {
			update: function(me) {
				me.scale -= 1.5 / Game.fps;
				if (me.scale <= 0) { me.die(); }
			},
			onClick: function(me) {
				if (me.origin) {
					me.origin.onClick(me.origin);
					me.die();
				}
			},
			init: function() {
				this.y = -1000;
			}
		}
		decay.spawnTeleportMirage = function(it) {
			var m = new decay.powerOrb(decay.teleportMirageObj);
			m.x = it.x;
			m.y = it.y;
			m.scale = it.scale;
			m.origin = it;
			m.l.style.backgroundColor = getComputedStyle(it.l).backgroundColor;
			m.l.style.borderColor = getComputedStyle(it.l).borderColor;
			m.draw();
		}

		decay.powerOrb.prototype.selectMode = function(bans) {
			var pool = ['floating', 'jumpy'];
			if (this.hp > this.hpMax / 2) { pool.push('daring'); } else { pool.push('teleporting'); }
			if (this.hp < this.hpMax / 5) { pool.push('crazy'); }
			
			if (Math.random() < 0.8 && pool.indexOf(this.mode) != -1) { pool.splice(pool.indexOf(this.mode), 1); }
			for (let i in bans) {
				if (pool.indexOf(bans[i]) != -1) { pool.splice(pool.indexOf(bans[i]), 1); }
			}
			if (pool.length) { return choose(pool); } else { return this.selectMode(); }
		}
		decay.powerOrb.prototype.changeMode = function(mode) {
			if (this.mode == 'teleporting') {
				this.simulating = true;
				this.scaleMult = 1;
			}
			if (this.mode == 'fleeing') {
				this.bounceMode = 1;
			}
				
			var timeUntilNext = 0;
			this.mode = mode;
			this.times.sinceLastModeChange = 0;
			switch (mode) {
				case 'floating':
					this.frictionX = 0.98;
					this.frictionY = 0.99;
					this.bounceLoss = 0.98;
					timeUntilNext = Game.fps * (20 + 40 * Math.random());
					break;
				case 'jumpy':
					this.frictionX = 0.998;
					this.frictionY = 0.985;
					this.bounceLoss = 0.8;
					this.times.sinceLastJump = 0;
					timeUntilNext = Game.fps * (10 + 30 * Math.random());
					break;
				case 'daring':
					this.frictionX = 0.995;
					this.frictionY = 0.995;
					this.bounceLoss = 0.9;
					this.times.sinceLastJump = 0;
					timeUntilNext = Game.fps * (30 + 10 * Math.random());
					break;
				case 'teleporting':
					this.frictionX = 0.95;
					this.frictionY = 0.95;
					this.bounceLoss = 1;
					timeUntilNext = Game.fps * (10 + 20 * Math.random());
					break;
				case 'crazy':
					this.frictionX = 0.995;
					this.frictionY = 0.995;
					this.bounceLoss = 0.6;
					timeUntilNext = Game.fps * (2 + 1 * Math.random());
					break;
				case 'fleeing':
					this.frictionX = 0.975;
					this.frictionY = 0.99;
					this.bounceLoss = 1;
					timeUntilNext = 100000000000000;
					this.bounceMode = 0;
					break;
			}
			this.nextModeIn = timeUntilNext;
		}
  
		decay.lastMouseMovePosition = [0, 0];
		decay.handlePowerOrbSelects = function() {
			if (!decay.powerOrbs.length) { return; }
			const [x, y] = decay.lastMouseMovePosition;
			const l = document.elementFromPoint(x, y);
			for (let i in decay.powerOrbs) {
				if (decay.powerOrbs[i].l === l) {
					decay.powerOrbs[i].selected = true;
				} else { 
					decay.powerOrbs[i].selected = false;
				}
			}
		}
		decay.updateLastMouseMovePosition = function(e) {
			decay.lastMouseMovePosition = [e.clientX, e.clientY];
		}
		AddEvent(document, 'mousemove', function(e) { decay.updateLastMouseMovePosition(e); decay.handlePowerOrbSelects(e); });
		setInterval(decay.handlePowerOrbClicks, 10);
		decay.powerOrb.prototype.clickHandler = function(event) {
			decay.times.sinceOrbClick = 0;
			if (event) { event.preventDefault(); }
			this.onClick(this);
		}
		decay.powerOrb.prototype.spawnAura = function() {
			const size = this.size * this.scale;
			const hpFrac = this.hp / this.hpMax;
			Crumbs.spawn(decay.soulClaimAuraTemplate, {
				behaviors: decay.soulClaimAuraBehaviorPure,
				x: this.x + size / 2,
				y: this.y + size / 2,
				scope: 'foreground',
				color: getComputedStyle(this.l).borderColor,
				currentSize: size / 2,
				currentWidth: 7 * this.scale,
				expandSpeed: (200 + 500 * (1 - hpFrac)) / Game.fps,
				thinningSpeed: hpFrac / Game.fps,
				expandFriction: (0.85 + hpFrac * 0.05),
				thinningAcceleration: (0.6 + hpFrac) / Game.fps
			});
		}
		decay.powerOrb.prototype.onClick = function(me) {
			if (!decay.gameCan.clickPowerOrbs || me.times.sinceLastClick < (Game.hasBuff('Haggler\'s luck')?0.1:0.5) * Game.fps) { return; }
			if (this.mirage) {
				if (this.mirage.onClick) { this.mirage.onClick(me); }
				return;
			}
			Game.Notify('Orb clicked!', '', 0, 0.5);
			this.spawnAura();
			decay.triggerNotif('powerOrb');
			
			me.velocity.add(decay.polar((Math.random() * 50 + 50) * (1 - 0.8 * this.hp / this.hpMax) * (decay.prefs.slowOrbs?0.5:1), 2 * Math.PI * (Math.random() - 0.5)));
			me.times.sinceLastClick = 0;
			me.fleeIn += 20 * Game.fps;
			if (this.mode == 'teleporting' || this.mode == 'fleeing') {
				this.changeMode(this.selectMode(['teleporting']));
			}
			me.nextModeIn /= 4; me.nextModeIn = Math.floor(me.nextModeIn);
			
			me.hp -= 12 * (Game.Has('Dominions')?1.5:1) * (decay.challengeStatus('godz')?1.4:1) * (Game.hasBuff('Haggler\'s luck')?1.5:1);
			decay.stop(1.8, 'click');
		}
		decay.powerOrb.prototype.onBounce = function() {
			this.times.sinceLastBounce = 0;
		}
		decay.powerOrb.prototype.draw = function() {
			//updates associated html element
			this.l.style.left = this.x + 'px';
			this.l.style.top = this.y + 'px';
			this.l.style.width = this.size + 'px';
			this.l.style.height = this.size + 'px';
			this.l.style.transform = 'rotate('+this.r+') scale('+(this.scale*this.scaleMult)+')';
		}
		decay.updatePowerOrbs = function() {
			for (let i in decay.powerOrbs) {
				decay.powerOrbs[i].draw();
				decay.powerOrbs[i].update();
			}
		}

		decay.killAllPowerOrbs = function() {
			for (let i = decay.powerOrbs.length-1; i >= 0; i--) {
				decay.powerOrbs[i].expire();
			}
		}
		decay.resetPower = function() {
			decay.power = (decay.challengeStatus('powerClickWrinklers')?decay.firstPowerClickReq:0);
			decay.times.sincePowerClick = 10000;
			decay.times.sincePowerGain = 0;
			decay.powerClickToLeftSectionSpeed = 1;
		}
		Game.registerHook('reset', function() { decay.killAllPowerOrbs(); decay.resetPower(); });
		decay.clicksEligibleForPowerOrbs = 0;
		decay.spawnPowerOrbs = function() {
			if (decay.powerOrbsN > 0 || decay.power < decay.powerClickReqs[0] || !decay.powerUnlocked() || decay.covenantStatus('powerGain')) { return; }

			let inverseChance = 0.987;
			inverseCbance = Math.pow(inverseChance, (1 + (decay.power - decay.powerClickReqs[0]) / 100) / (1 + Math.max(Game.log10CookiesSimulated - 18, 0) * 0.1));
			inverseChance = Math.pow(inverseChance, 1 - 1 / (1 + decay.times.sinceOrbClick / Game.fps / 6));
			if (Game.Has('Dominions')) { inverseChance = Math.pow(inverseChance, 1.5); }
			if (decay.isConditional('typing') || decay.isConditional('typingR') || decay.isConditional('power') || decay.isConditional('powerClickWrinklers')) { inverseChance = Math.pow(inverseChance, 6); }
			let pity = 2 / (1 - inverseChance);
			if (decay.clicksEligibleForPowerOrbs > pity || Math.random() < (1 - inverseChance)) {
				const orb = new decay.powerOrb();
				const begin = Math.floor(Math.random() * 360);
				Crumbs.spawn(decay.shinySoulConnectLineTemplate, {
					targetX: orb.x,
					targetY: orb.y,
					originX: Crumbs.scopedCanvas.left.mouseX,
					originY: Crumbs.scopedCanvas.left.mouseY,
					lineWidth: 20,
					decreaseRate: 16 / Game.fps,
					color: 'hsl('+begin+', 100%, 50%)'
				});
				const obj = {
					behaviors: decay.soulClaimAuraBehaviorPure,
					x: orb.x,
					y: orb.y,
					scope: 'foreground',
					color: 'hsl('+begin+', 100%, 50%)',
					currentSize: 20,
					currentWidth: 5,
					expandSpeed: 50 / Game.fps,
					thinningSpeed: 0.4 / Game.fps,
					expandFriction: 0.85,
					thinningAcceleration: 0.5 / Game.fps
				};
				const colorStep = Math.floor(Math.random() * 35) + 35;
				const sizeStep = 10;
				for (let i = 1; i <= 1 + Math.floor(Math.pow(Math.random(), 3) * 4); i++) {
					obj.color = 'hsl('+((begin + i * colorStep) % 360)+', 100%, 50%)';
					obj.expandSpeed += sizeStep * 10 / Game.fps;
					obj.currentWidth += sizeStep * 0.2;
					obj.currentSize += sizeStep;
					Crumbs.spawn(decay.soulClaimAuraTemplate, obj);
				}
				Crumbs.spawn(decay.soulClaimAuraTemplate, {
					behaviors: decay.soulClaimAuraBehaviorPure,
					x: Crumbs.scopedCanvas.left.mouseX,
					y: Crumbs.scopedCanvas.left.mouseY,
					scope: 'left',
					color: 'hsl('+begin+', 100%, 50%)',
					currentSize: 20,
					currentWidth: 10,
					expandSpeed: 200 / Game.fps,
					thinningSpeed: 0.4 / Game.fps,
					expandFriction: 0.9,
					thinningAcceleration: 0.4 / Game.fps
				});
			}
			decay.clicksEligibleForPowerOrbs++;
		}
		decay.buildPowerClickReqs();
		Game.registerHook('click', decay.spawnPowerOrbs);

		new Game.Upgrade('Boundless sack', 'Popping power orbs store a fraction of their power within this sack, and allows you to summon a power orb when filled.<br>Hotkey: <b>Ctrl + B</b>', 0, [34, 12]); Game.last.order = 17001;
		Game.last.pool = 'toggle'; Game.UpgradesByPool.toggle.push(Game.last);
		addLoc('<b>%1</b> out of <b>%2</b> power orbs stored');
		Game.last.displayFuncWhenOwned = function() { return '<div style="text-align: center;">' + loc('<b>%1</b> out of <b>%2</b> power orbs stored', [Beautify(decay.boundlessSackOrbCount), Beautify(decay.boundlessSackOrbThreshold)]) + '</div>'; }
		//Game.last.timerDisplay = function() { return -1; }
		decay.boundlessSackOrbCount = 0;
		decay.boundlessSackOrbThreshold = 2;
		decay.boundlessSackOrbMaximum = 2;
		Game.Lock('Boundless sack');
		if (Game.Has('Virtues')) { Game.last.bought = 1; }
		Game.last.buyFunction = function() {
			if (decay.boundlessSackOrbCount < decay.boundlessSackOrbThreshold) { return; }
			new decay.powerOrb();
			decay.boundlessSackOrbCount = 0;
			Game.Upgrades['Boundless sack'].icon = [34, 12];
			Game.upgradesToRebuild = 1;
		}
		addLoc('<b>Ready to release</b>!');
		Game.last.descFunc = function() {
			if (decay.boundlessSackOrbCount < decay.boundlessSackOrbThreshold) { return this.ddesc; }
			return '<div style="text-align: center;">' + loc('<b>Ready to release</b>!') + '</div><div class="line"></div>' + this.ddesc;
		}
		Game.registerHook('check', function() { if (Game.Has('Virtues')) { Game.Unlock('Boundless sack'); } });
		decay.tryStoreBoundlessSack = function(amount) {
			if (!Game.Has('Virtues')) { return; }

			decay.boundlessSackOrbCount = Math.min(decay.boundlessSackOrbCount + amount, decay.boundlessSackOrbMaximum);
			if (decay.boundlessSackOrbCount >= decay.boundlessSackOrbThreshold) {
				Game.Upgrades['Boundless sack'].icon = [15, 0, kaizoCookies.images.custImg]; 
				Game.Lock('Boundless sack');
				Game.Unlock('Boundless sack');
			}
		}
		decay.saveBoundlessSack = function() {
			let str = '';
			str += decay.boundlessSackOrbCount;
			return str;
		}
		decay.loadBoundlessSack = function(str) {
			if (isv(str) && str) { decay.boundlessSackOrbCount = parseFloat(str); }

			if (Game.Has('Virtues')) { Game.Unlock('Boundless sack'); }
			if (decay.boundlessSackOrbCount >= decay.boundlessSackOrbThreshold) { Game.Upgrades['Boundless sack'].icon = [15, 0, kaizoCookies.images.custImg]; Game.Lock('Boundless sack'); Game.Unlock('Boundless sack'); }
		}
		AddEvent(document, function(e) { if (Game.HasUnlocked('Boundless sack') && e.ctrlKey && e.key.toLowerCase() == 'b') { Game.Upgrades['Boundless sack'].buy(); } });

		/*=====================================================================================
        Challenge mode
        =======================================================================================*/

		addLoc('Decay gains \"Acceleration\", an ever-increasing boost to decay propagation. Past x1.5 acceleration, acceleration also starts boosting the amount of halting methods required to halt by the same amount / 1.5.<div class=\"line\"></div>Perform tasks in order to complete challenges and get rewards. You can find the list of challenges in the Stats menu during the challenge mode.');
		Game.ascensionModes[42069] = {name:'Unshackled decay',dname:loc("Unshackled decay"),desc:loc("Decay gains \"Acceleration\", an ever-increasing boost to decay propagation. Past x1.5 acceleration, acceleration also starts boosting the amount of halting methods required to halt by the same amount / 1.5.<div class=\"line\"></div>Perform tasks in order to complete challenges and get rewards. You can find the list of challenges in the Stats menu during the challenge mode."),icon:[23,15,kaizoCookies.images.custImg]};

		eval('Game.PickAscensionMode='+Game.PickAscensionMode.toString().replace(`background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;`, `'+writeIcon(icon)+'`));

		eval('Game.Logic='+Game.Logic.toString().replace("if (Game.Has('Legacy') && Game.ascensionMode!=1)", "if (false)"));
		//eval('Game.Logic='+Game.Logic.toString().replace("if (timePlayed<=1000*60*35) Game.Win('Speed baking I');", "if (Game.TCount<=1000*60*35*Game.fps && Game.ascensionMode==1) Game.Win('Speed baking I');"));
		//eval('Game.Logic='+Game.Logic.toString().replace("if (timePlayed<=1000*60*25) Game.Win('Speed baking II');", "if (Game.TCount<=1000*60*25*Game.fps && Game.ascensionMode==1) Game.Win('Speed baking II');"));
		//eval('Game.Logic='+Game.Logic.toString().replace("if (timePlayed<=1000*60*15) Game.Win('Speed baking III');", "if (Game.TCount<=1000*60*35*Game.fps && Game.ascensionMode==1) Game.Win('Speed baking I');"));

		eval('Game.Reset='+Game.Reset.toString().replace('if (Game.permanentUpgrades[i]!=-1)', 'if (Game.permanentUpgrades[i]!=-1 && parseFloat(i) != 3 && parseFloat(i) != 4)'));
		Game.Upgrades['Permanent upgrade slot IV'].showIf = function() { return false; }
		Game.Upgrades['Permanent upgrade slot IV'].pool = 'debug';
		Game.PrestigeUpgrades.splice(Game.PrestigeUpgrades.indexOf(Game.Upgrades['Permanent upgrade slot IV']), 1);
		delete Game.UpgradePositions[Game.Upgrades['Permanent upgrade slot IV'].id];
		Game.UpgradesByPool['prestige'].splice(Game.UpgradesByPool['prestige'].indexOf(Game.Upgrades['Permanent upgrade slot IV']), 1);
		Game.UpgradesByPool['debug'].push(Game.Upgrades['Permanent upgrade slot IV']);
		Game.Upgrades['Permanent upgrade slot V'].showIf = function() { return false; }
		Game.Upgrades['Permanent upgrade slot V'].pool = 'debug';
		Game.UpgradesByPool['prestige'].splice(Game.UpgradesByPool['prestige'].indexOf(Game.Upgrades['Permanent upgrade slot V']), 1);
		Game.UpgradesByPool['debug'].push(Game.Upgrades['Permanent upgrade slot V']);
		Game.PrestigeUpgrades.splice(Game.PrestigeUpgrades.indexOf(Game.Upgrades['Permanent upgrade slot V']), 1);
		delete Game.UpgradePositions[Game.Upgrades['Permanent upgrade slot V'].id];

		decay.highestReachedChallenged = 0;

		injectCSS(`.singleChallenge { margin-top: 5px; margin-bottom: 5px; display:flex; justify-content:center; align-items: center; padding: 3px 5px; border-radius: 8px; }`);
		injectCSS(`.nameSection { display: inline-block; width: 32px; font-size: 0.9em; padding: 2px; position:relative; float: left; align-items: center; text-align: center; }`);
		injectCSS(`.nameSeparator { display: inline-block; position:relative; width: 1px; height: 24px; background-color: rgba(255,255,255,0.2); margin-left: 2px; margin-right: 3px; }`);
		injectCSS(`.challengeToggle { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 1px; padding-top: 6px;  }`)
		injectCSS(`.taskSection { display: inline-block; width: 50%; padding: 2px; position:relative; align-items: center; text-align: left; }`);
		injectCSS(`.rewardSection { display: inline-block; width: 50%; padding: 2px; position:relative; text-align: right; vertical-align: center; align-items: center; }`);
		//injectCSS(`.rewardSection::before { content: ""; display: inline-block; vertical-align: middle; height: 100%; }`);
		//injectCSS(`.rewardSection span { display: inline-block; vertical-align: middle; }`)
		injectCSS(`.challengeNotice { font-style: italic; text-align: center; margin: auto; padding-top: 8px; padding-bottom: 1px; }`);
		injectCSS(`.prereqNotice { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.cannotCompleteWarning { font-style: italic; font-size: 0.9em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.conditionalNotice { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.repeatableNotice { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.singleChallenge.canSelect { border-width: 5px; cursor: pointer; }`);
		injectCSS(`.cannotComplete { background: linear-gradient(to right, #eb4034, transparent 35%, transparent 65%, #eb4034); }`);
		injectCSS(`.singleChallenge.cannotComplete { background: linear-gradient(to right, #eb4034, transparent 35%, transparent 65%, #eb4034); }`);
		injectCSS(`.circleDisplay { display: inline-block; width: 7px; height: 7px; margin: 0px 2px 0px 2px; border: 2px solid #808080; border-radius: 50%; }`);
		injectCSS(`.smallFancyButton.framed.challengeUtilityButton { cursor: pointer; font-size: 10px; text-align: center; margin-bottom: -1px; margin-top: -1px; }`);
		injectCSS(`.smallFancyButton.framed.challengeUtilityButton:hover { color:#fff; text-shadow: none; }`);
		decay.challenges = {};
		decay.conditionalChallenges = {};
		decay.repeatableChallenges = {};
		decay.challengeCategories = {
			vial: [],
			box: [],
			truck: []
		}
		decay.categoryToPrefixMap = {
			null: 'M',
			vial: 'V',
			box: 'B',
			truck: 'T'
		}
		//if a certain challenge is done it will be set to true, used for unlocking stuff
		decay.challenge = function(key, desc, check, rewardDesc, unlockCondition, misc) {
			//onCompletion is a function, rewardDesc is a function or string, desc can be a string or function, check is logic for checking if the current game state satisfies the challenge (will have timePlayed passed into it)
			this.key = key;
			this.id = Object.keys(decay.challenges).length;
			this.desc = desc;
			this.checkVar = check;
			if (typeof this.checkVar === 'object') { this.checkVar.challengeObj = this; }
			this.rewardDesc = rewardDesc;
			this.complete = 0; //using numbers instead of actual booleans for easy multi completion support
			this.unlockCondition = unlockCondition;
			this.eleid = -1;
			this.cannotComplete = false;
			this.rewardEnabled = true;
			misc = misc||{};
			if (misc.onCompletion) {
				this.onCompletion = misc.onCompletion;
			}
			if (misc.completedColor) {
				this.completedColor = misc.completedColor;
			} else { this.completedColor = 'rgba(103, 255, 106, 0.4)'; }
			if (misc.icon) {
				this.icon = misc.icon;
			}
			if (misc.prereq) { 
				this.prereq = [].concat(misc.prereq);
			}
			this.isPrereq = false;
			if (misc.order) {
				this.order = misc.order;
			} else { this.order = this.id; }
			if (misc.conditional) {
				this.conditional = misc.conditional;
				if (this.conditional) { decay.conditionalChallenges[key] = this; }
				if (misc.reincarnate) { this.reincarnate = misc.reincarnate; }
				if (misc.init) { this.init = misc.init; }
				if (misc.reset) { this.reset = misc.reset; }
				if (misc.update) { this.update = misc.update; }
			} else { this.conditional = false; }
			if (misc.repeatable) {
				this.repeatable = misc.repeatable;
				if (this.repeatable) { decay.repeatableChallenges[key] = this; }
			} else { this.repeatable = false; }
			
			this.unlocked = false;
			decay.challenges[key] = this;
			if (misc.deprecated) {
				this.deprecated = true;
				return;
			}

			decay.totalChallenges++;
			
			if (misc.category) { this.category = misc.category; }
			else if (unlockCondition==decay.challengeUnlockModules.vial) { this.category = 'vial'; } 
			else if (unlockCondition==decay.challengeUnlockModules.box) { this.category = 'box'; } 
			else if (unlockCondition==decay.challengeUnlockModules.truck) { this.category = 'truck'; }  
			else { this.category = null; }
			if (this.category) { decay.challengeCategories[this.category].push(this); }
			if (misc.name) {
				this.name = misc.name;
			} else {
				this.name = decay.categoryToPrefixMap[this.category] + this.id;
			}
		}
		decay.challenge.prototype.getDesc = function() {
			if (typeof this.desc === 'function') { return this.desc(this.complete); } else { return this.desc; }
		}
		decay.challenge.prototype.getRewards = function(hideDetails) {
			if (typeof this.rewardDesc === 'function') { return this.rewardDesc(hideDetails); } else { return this.rewardDesc; }
		}
		decay.challenge.prototype.check = function() {
			if (this.cannotComplete) { return false; }
			if (this.checkVar.o) { return this.checkVar.check(this.checkVar, this.complete); } 
			else { return this.checkVar(this); }
		}
		addLoc('Challenge complete!');
		addLoc('You completed challenge <b>%1</b>!');
		decay.challenge.prototype.finish = function(silent) {
			if (this.repeatable) { this.complete++; } else { this.complete = 1; }
			decay.getCompletionCount();
			if (!silent) { 
				Game.Notify(loc('Challenge complete!'), loc('You completed challenge <b>%1</b>!', this.name), this.icon??([12, 6]), 1e10, false, true);
			}
			if (this.onCompletion) { this.onCompletion(); }
			kaizoCookies.checkChallengeAchievs();
			decay.checkChallengeUnlocks();
			Game.UpdateMenu();
			Game.WriteSave();
		}
		decay.challenge.prototype.checkUnlock = function() {
			if (!this.unlockCondition() || this.deprecated) { return false; }
			for (let i in this.prereq) {
				//console.log(this.prereq[i]);
				if (!decay.challenges[this.prereq[i]].complete) { return false; }
			}
			return true;
		}
		decay.challenge.prototype.checkPrereq = function() {
			if (!this.prereq) { return true; }
			for (let i in this.prereq) {
				if (!decay.challenges[this.prereq[i]].complete) { return false; }
			}
			return true;
		}
		decay.challenge.prototype.toggleReward = function() {
			this.rewardEnabled = !this.rewardEnabled;
			Game.recalculateGains = 1;
			Game.UpdateMenu();
			decay.ascendKeptUpgradeList = decay.getAscendKeptUpgradeList();
			if (Game.specialTab != '') { Game.ToggleSpecialMenu(1); }
		}
		decay.challenge.prototype.makeCannotComplete = function() {
			const prevCannotComplete = this.cannotComplete;
			this.cannotComplete = true;
			if (!prevCannotComplete) { Game.UpdateMenu(); }
		}
		decay.challenge.prototype.save = function() {
			var str = this.complete + '^' + (this.cannotComplete?1:0) + '^' + (this.rewardEnabled?1:0);
			if (this.checkVar.o) { str += '^'+'c'+this.checkVar.save(this.checkVar); }
			return str;
		}
		decay.challenge.prototype.load = function(str) {
			if (this.deprecated) { return; }

			str = str.split('^'); 
			if (isv(str[0])) { this.complete = parseInt(str[0]); }
			if (isv(str[1])) { this.cannotComplete = Boolean(parseInt(str[1])); }
			if (isv(str[2]) && str[2][0] != 'c') { this.rewardEnabled = Boolean(parseInt(str[2])); }
			if (str.length <= 3) { return; }
			//str.splice(0, 2);

			for (let i in str) {
				if (str[i][0]=='c' && this.checkVar.o) { this.checkVar.load(this.checkVar, str[i].slice(1, str[i].length)); }
			}
		}
		decay.challenge.prototype.wipe = function() {
			this.complete = 0;
			this.unlocked = false;
		}
		decay.challenge.prototype.reset = function() {
			//on reincarnation
			this.cannotComplete = false;
			if (this.checkVar.o) {
				this.checkVar.commitInit();
			}
		}
		decay.resetAllChallengesInternalStatuses = function() {
			for (let i in decay.challenges) {
				decay.challenges[i].reset();
			}
		}
		decay.totalChallenges = 0;
		decay.challengesCompleted = 0;
		decay.getCompletionCount = function() {
			var n = 0;
			for (let i in decay.challenges) {
				if (decay.challenges[i].complete) { n++; } 
			}
			decay.challengesCompleted = n;
			return n;
		}
		decay.forceShowAllChallenges = false;
		decay.showCompletedChallenges = true;
		decay.showIncompleteChallenges = true;
		decay.conditionalColor = 'rgba(255, 190, 0, 0.25)';
		decay.repeatableColor = 'rgba(115, 234, 255, 0.2)';
		decay.repeatableConditionalColor = 'rgba(102, 255, 232, 0.2)';
		addLoc('Hide completed challenges');
		addLoc('Show completed challenges');
		addLoc('Hide unfinished challenges');
		addLoc('Show unfinished challenges');
		addLoc('Come back after getting some more heavenly upgrades! (Specifically, the <span class="highlightHover underlined" %1>Vial of challenges</span>)');
		decay.challengeDisplay = function() {
			//returns html for the challenges
			if (Game.ascensionMode != 42069 && !decay.challengesCompleted) { return ''; }
			let str = '<div class="subsection"><div class="title" style="position:relative;">Challenges</div>';
			str += '<div class="listing"><b>Challenges completed:</b> '+decay.getCompletionCount()+'/'+decay.totalChallenges+'</div>';
			str += '<div class="listing"><b>Highest cookies reached in Unshackled decay:</b> <div class="price plain">'+Game.tinyCookie()+Beautify(decay.highestReachedChallenged)+'</div></div><br>';
			str += '<div class="framed" id="challengeBox" style="margin: auto; width: 92%; padding: 0px 4px;">'; //height: 600px; overflow-y: scroll;
			if (Game.ascensionMode != 42069) {
				str += '<div class="challengeNotice">Because you are not in the <b>Unshackled decay</b> challenge mode, you cannot complete any challenges. However, you can still view any unlocked challenges, and the rewards still work.</div>';
				str += '<div class="line"></div>';
			}
			if (decay.currentConditional) {
				str += '<div class="challengeNotice">Because a conditional challenge is currently ongoing, you cannot complete any other challenges.</div>';
				str += '<div class="line"></div>';
			}
			str += '<div style="display: flex; justify-content: center; align-items: center;'+((Game.ascensionMode==42069?' margin-top: 8px;':''))+'">'
			str += '<div class="smallFancyButton framed challengeUtilityButton" '+Game.clickStr+'="decay.showCompletedChallenges=!decay.showCompletedChallenges;Game.UpdateMenu();">'+(decay.showCompletedChallenges?loc('Hide completed challenges'):loc('Show completed challenges'))+'</div>';
			str += '<div class="smallFancyButton framed challengeUtilityButton" '+Game.clickStr+'="decay.showIncompleteChallenges=!decay.showIncompleteChallenges;Game.UpdateMenu();">'+(decay.showIncompleteChallenges?loc('Hide unfinished challenges'):loc('Show unfinished challenges'))+'</div>';
			str += '</div><div class="line"></div>';
			let str2 = '';
			let hasPrereq = false;
			let hasConditional = false;
			let hasRepeatable = false;
			let cannotCompleteWarning = false;
			let ch = decay.sortChallenges();
			for (let i in ch) {
				if (((!ch[i].unlocked || (ch[i].complete && !decay.showCompletedChallenges) || (!ch[i].complete && !decay.showIncompleteChallenges)) && !decay.isConditional(ch[i].key) && !decay.forceShowAllChallenges) || ch[i].deprecated) { continue; }
				str2 += '<div class="'+(ch[i].rewardEnabled?'singleChallenge':'singleChallenge rewardDisabled');
				if ((ch[i].cannotComplete || (decay.currentConditional && !decay.isConditional(ch[i].key))) && !ch[i].complete && Game.ascensionMode == 42069) { cannotCompleteWarning = true; str2 += ' cannotComplete'; } 
				str2 += '" '+(ch[i].complete?(Game.clickStr+'="if (Game.keys[16]) { decay.challenges[\''+ch[i].key+'\'].toggleReward(); } if (Game.sesame && Game.keys[17]) { decay.challenges[\''+ch[i].key+'\'].complete = 0; decay.checkChallengeUnlocks(); Game.UpdateMenu(); }"'):(Game.clickStr+'="if (Game.keys[17] && Game.sesame) { decay.challenges[\''+ch[i].key+'\'].finish(); Game.UpdateMenu(); }"'));
				if (decay.isConditional(ch[i].key)) {
					str2 += ' id="activeConditional"';
				} else {
					if (ch[i].repeatable) {
						str2 += ' style="background-color:'+(ch[i].conditional?decay.repeatableConditionalColor:decay.repeatableColor)+';"';
						hasRepeatable = true;
					} else if (ch[i].complete) {
						if (!ch[i].rewardEnabled) { 
							str2 += ' style="background: linear-gradient(to right, '+ch[i].completedColor+', transparent 35%, transparent 65%, '+ch[i].completedColor+'); cursor: pointer;"';
						} else {
							str2 += ' style="background-color:'+ch[i].completedColor+'; cursor: pointer;"';
						}
					} else if (ch[i].conditional) {
						str2 += ' style="background-color:'+decay.conditionalColor+';"';
						hasConditional = true;
					}
				}
				str2 += '>';
				str2 += '<div class="nameSection"><b>'+ch[i].name+'</b></div><div class="nameSeparator"></div>';
				str2 += '<div class="taskSection">'+ch[i].getDesc()+'</div>';
				if (ch[i].isPrereq) { 
					str2 += '<div class="circleDisplay"></div>'; 
					hasPrereq = true;
				}
				str2 += '<div class="rewardSection">'+ch[i].getRewards()+'</div>';
				str2 += '</div>';
			}
			if (!str2) {
				str2 += '<div class="rewardSection" style="width: 100%; margin-bottom: 3px; text-align: center;">' + loc('It seems that there\'s nothing here.') + ((Game.Has('Vial of challenges') && Game.ascensionMode != 1)?'':' '+loc('Come back after getting some more heavenly upgrades! (Specifically, the <span class="highlightHover underlined" %1>Vial of challenges</span>)', decay.getUpgradeTooltipCSS('Vial of challenges'))) + '</div>';
			}
			if (hasPrereq) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="prereqNotice"'+((hasConditional || hasRepeatable || cannotCompleteWarning)?('style="padding-bottom: 1px;"'):'')+'>Challenges with a circle in the middle indicates that it is a prerequisite to unlocking another challenge.</div>';
			}
			if (cannotCompleteWarning) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="cannotCompleteWarning">'+'Normal challenges marked with <span class="cannotComplete" style="border-radius: 4px; padding-left: 2px; padding-right: 2px;">red on the edges</span> cannot be (or can no longer be) completed in this ascension due to the challenge\'s requirements.'+'</div>';
			}
			if (hasConditional) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="conditionalNotice"'+(hasRepeatable?('style="padding-bottom: 1px;"'):'')+'>Challenges that are not completed and <span style="background-color:'+decay.conditionalColor+';">highlighted with this color</span> requires you to enable it at the beginning of the ascension. While one is active, no other challenges can be obtained.</div>';
			}
			if (hasRepeatable) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="repeatableNotice">Challenges highlighted with <span style="background-color:'+decay.repeatableColor+';">this color</span> (and <span style="background-color:'+decay.repeatableConditionalColor+';">with this color</span> for challenges that require <span style="background-color:'+decay.conditionalColor+';">enabling when ascending</span>) can be completed repeatedly; each completion gives you the reward stacking with previous completions, and simultaneously raises the requirement.</div>';
			}
			
			return str+str2+'</div><div class="challengeToggle">Shift-click a completed challenge to disable or enable its reward.</div></div>'; 
		}
		eval('Game.Reincarnate='+Game.Reincarnate.toString().replace('Game.Reincarnate(1);', 'if (Game.nextAscensionMode != 42069) { Game.Reincarnate(1); } else { decay.checkChallengeUnlocks(); decay.chooseConditionalPrompt(); }'));
		addLoc('Choose a challenge to start your ascension with, or skip. If a challenge is chosen, you cannot complete any other challenges in the same ascension; the chosen challenge will be highlighted red in stats. To complete the challenges not shown here, click skip.');
		addLoc('Skip');
		decay.findEleidByKey = function(key) {
			for (let i in decay.conditionalChallenges) {
				if (decay.conditionalChallenges[i].key == key) { return decay.conditionalChallenges[i].eleid; }
			}
			return -1;
		}
		decay.selectedChallenge = null;
		decay.getChBGWhenSelecting = function(ch) {
			if (ch.repeatable) { return decay.repeatableColor; } 
			if (ch.complete) { return ch.completedColor; }
			return '';
		}
		decay.chooseConditionalPrompt = function() {
			var checker = false;
			for (let i in decay.conditionalChallenges) {
				checker = (checker || decay.conditionalChallenges[i].unlocked);
			}
			if (!checker) { Game.Reincarnate(1); return; }
			var str = ''; //put the challenges in here
			var availableList = [];
			var completedList = [];
			var list = decay.sortChallenges();
			for (let i in list) {
				if (!list[i].conditional || !list[i].unlocked || list[i].deprecated) { continue; }
				if (list[i].complete) { completedList.push(list[i]); } else { availableList.push(list[i]); }
			}
			var counter = 0;
			const selectedBorderColor = 'rgba(255, 255, 255, 0.15)'; //border-color doesnt work somehow so its for background color instead
			for (let i in availableList) {
				str += '<div id="ch'+counter+'" class="singleChallenge canSelect" '+(availableList[i].repeatable?'style="background-color: '+decay.repeatableColor+';"':'')+'onclick="if (decay.selectedChallenge==\''+availableList[i].key+'\') { l(\'ch'+counter+'\').style.backgroundColor=decay.getChBGWhenSelecting(decay.challenges[decay.selectedChallenge]); decay.selectedChallenge = null; } else { l(\'ch'+counter+'\').style.backgroundColor=\''+selectedBorderColor+'\'; if (decay.selectedChallenge) { l(\'ch\'+decay.findEleidByKey(decay.selectedChallenge)).style.backgroundColor=decay.getChBGWhenSelecting(decay.challenges[decay.selectedChallenge]); } decay.selectedChallenge = \''+availableList[i].key+'\'; }"><div class="taskSection">'+availableList[i].getDesc()+'</div>'+(availableList[i].isPrereq?'<div class="verticalLine"></div>':'')+'<div class="rewardSection">'+availableList[i].getRewards(true)+'</div></div>';
				availableList[i].eleid = counter;
				counter++;
			}
			for (let i in completedList) {
				str += '<div id="ch'+counter+'" class="singleChallenge canSelect" style="background-color:'+completedList[i].completedColor+';" onclick="if (decay.selectedChallenge==\''+completedList[i].key+'\') { decay.selectedChallenge = null; l(\'ch'+counter+'\').style.backgroundColor=\''+completedList[i].completedColor+'\'; } else { l(\'ch'+counter+'\').style.backgroundColor=\''+selectedBorderColor+'\'; if (decay.selectedChallenge) { l(\'ch\'+decay.findEleidByKey(decay.selectedChallenge)).style.backgroundColor=decay.getChBGWhenSelecting(decay.challenges[decay.selectedChallenge]); } decay.selectedChallenge = \''+completedList[i].key+'\'; }"><div class="taskSection">'+completedList[i].getDesc()+'</div>'+(completedList[i].isPrereq?'<div class="verticalLine"></div>':'')+'<div class="rewardSection">'+completedList[i].getRewards(true)+'</div></div>';
				completedList[i].eleid = counter;
				counter++;
			}
			Game.Prompt('<id choosingConditional><h3>Initiate challenge</h3><div class="block">'+loc('Choose a challenge to start your ascension with, or skip. If a challenge is chosen, you cannot complete any other challenges in the same ascension; the chosen challenge will be highlighted red in stats. To complete the challenges not shown here, click skip.')+'</div><div class="block" style="overflow-y: auto; height: 440px; ">'+str+'</div>', [[loc('Confirm'), 'Game.Reincarnate(1); Game.ClosePrompt();'], [loc('Skip'), 'decay.selectedChallenge = null; Game.Reincarnate(1); Game.ClosePrompt();']], function() { l('prompt').style.width = '750px'; l('prompt').style.transform = 'translate(-33%, 0%)'; }, ''); //truly some extreme levels of wack
		}
		eval('Game.ClosePrompt='+Game.ClosePrompt.toString().replace('Game.promptNoClose=false;', 'Game.promptNoClose=false; Game.resetPromptWidth();'));
		decay.setConditionalFromSelected = function(hard) { if (decay.selectedChallenge && !hard) { decay.currentConditional = decay.selectedChallenge; } else { decay.currentConditional = null; } decay.selectedChallenge = null; };
		eval('Game.Reset='+Game.Reset.toString().replace(`Game.T=0;`, `Game.T=0; decay.setConditionalFromSelected(hard);`));
		Game.resetPromptWidth = function() {
			l('prompt').style.width = ''; l('prompt').style.transform = '';
		}
		decay.clearConditional = function() { decay.performConditionalResets(); decay.currentConditional = null; decay.checkRotation(); }
		eval('Game.Ascend='+Game.Ascend.toString().replace('Game.killShimmers();', 'Game.killShimmers(); decay.clearConditional();'));
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`'</div><div class="subsection">'+`, `'</div>'+decay.challengeDisplay()+'<div class="subsection">'+`));
		decay.checkChallengeUnlocks = function() {
			for (let i in decay.challenges) {
				decay.challenges[i].unlocked = decay.challenges[i].checkUnlock();
			}
		}
        decay.checkChallenges = function(){
			if (Game.ascensionMode !== 42069) { return; }
			if (decay.currentConditional) {
				if ((!decay.challenges[decay.currentConditional].complete || decay.challenges[decay.currentConditional].repeatable) && decay.challenges[decay.currentConditional].check()) { decay.challenges[decay.currentConditional].finish(false); }
				return;
			}
			if (Game.T%15===0) {
				var challenges = decay.challenges;
				for (let i in challenges) {
					if (challenges[i].unlocked && !challenges[i].conditional && (!challenges[i].complete || challenges[i].repeatable) && challenges[i].check() && !challenges[i].cannotComplete) { challenges[i].finish(false); }
				}
			}

			if (Game.T%1000===0) {
				decay.checkChallengeUnlocks();
			}
		}
		decay.sortChallenges = function() {
			//ik this sort is awful but it only gets called once per 5 seconds with less than a hundred elements and only if the stats is open so who cares
			var arr = [];
			for (let i in decay.challenges) {
				var done = false;
				for (let j in arr) {
					if (arr[j].order > decay.challenges[i].order) {
						arr.splice(j, 0, decay.challenges[i]);
						done = true;
						break;
					}
				}
				if (!done) {
					arr.push(decay.challenges[i]);
				}
			}
			return arr;
		}
		Game.registerHook('logic', decay.checkChallenges);
		decay.markPrereqs = function() {
			for (let i in decay.challenges) {
				let ch = decay.challenges[i];
				ch.isPrereq = false;
				for (let ii in decay.challenges) {
					if (!decay.challenges[ii].deprecated && decay.challenges[ii].prereq && decay.challenges[ii].prereq.includes(ch.key)) { ch.isPrereq = true; break; }
				}
			}
		}
		decay.challengeStatus = function(key) {
			if (!decay.challenges[key]?.rewardEnabled || Game.ascensionMode == 1) { return 0; }
			return decay.challenges[key].complete;
		}
		decay.currentConditional = null; //put the key here or null for no conditional
		decay.isConditional = function(key) {
			return (decay.currentConditional == key);
		}
		decay.performConditionalInits = function() {
			if (decay.currentConditional) { if (decay.challenges[decay.currentConditional].init) { decay.challenges[decay.currentConditional].init(); } }
		}
		decay.performConditionalResets = function() {
			if (decay.currentConditional) { if (decay.challenges[decay.currentConditional].reset) { decay.challenges[decay.currentConditional].reset(); } }
		}

		//Game.T except that it doesnt reset on load
		//counts independently with Game.T but resets on ascension and reincarnation
		Game.TCount = 0;
		Game.resetTCount = function() { Game.TCount = 0; }
		Game.registerHook('reincarnate', Game.resetTCount);
		Game.registerHook('reset', Game.resetTCount);
		addLoc('Bake <b>%1</b> cookies this ascension.');
		addLoc('Survive for <b>%1</b>.');
		addLoc('Bake <b>%1</b> cookies this ascension, then keep it for <b>%2</b>.');
		decay.challengeDescModules = {
			//mostly utility
			//all the "time" here are in seconds
			bakeCookies: function(amount) {
				return loc('Bake <b>%1</b> cookies this ascension.', Beautify(amount));
			},
			survive: function(time) {
				return loc('Survive for <b>%1</b>.', Game.sayTime(time * Game.fps, -1));
			},
			bakeAndKeep: function(amount, time) {
				return loc('Bake <b>%1</b> cookies this ascension, then keep it for <b>%2</b>.', [Beautify(amount), Game.sayTime(time * Game.fps, -1)]);
			},
			bakeFast: function(amount, time) {
				return loc("Get to <b>%1</b> baked in <b>%2</b>.",[loc("%1 cookie",LBeautify(amount)),Game.sayTime(time * Game.fps, -1)]);
			},
		}
		decay.challengeUnlockModules = {
			//utility
			always: function() {
				return true;
			},
			vial: function() {
				return Game.Has('Vial of challenges');
			},
			box: function() {
				return Game.Has('Box of challenges');
			},
			truck: function() {
				return Game.Has('Truck of challenges');
			},
			never: function() {
				return false;
			}
		} 
		//for convenience
		//the first three are functions with the checker object passed into them, but load with an extra str argument
		//init is an object where everything except for the reserved keys ('o', 'check', 'save', 'load') are copied into the object
		decay.challengeChecker = function(check, save, load, init) {
			this.init = init;
			this.commitInit();
			this.o = true;
			this.check = check;
			this.save = save;
			this.load = load;
		}
		decay.challengeChecker.prototype.commitInit = function() {
			for (let i in this.init) {
				this[i] = this.init[i];
			}
		}
		//contains modules to put into challengeChecker
		//put the raw reference into the first three arguments, then the return value of init into the init argument
		decay.checkerBundles = {
			bakeAndKeep: {
				check: function(t) {
					if (!t.passed && Game.cookiesEarned >= t.threshold) { t.passed = true; t.passedAt = Game.TCount; }
					return Boolean(Game.cookiesEarned >= t.amount && Game.TCount > t.passedAt + t.time);
				},
				save: function(t) {
					return t.passedAt+'-'+(t.passed?1:0);
				},
				load: function(t, str) {
					str = str.split('-');
					t.passedAt = parseFloat(str[0]);
					t.passed = Boolean(parseFloat(str[1]));
				},
				init: function(amount, time, threshold) {
					return {
						amount: amount,
						threshold: (threshold?threshold:amount),
						time: time,
						passedAt: 0,
						passed: false
					};
				}
			},
			keepHalt: {
				check: function(t) {
					const h = (decay.effectiveHalt >= 1);
					if (!t.active && h) { t.active = true; t.activeAt = Game.TCount; } 
					else if (!h) { t.active = false; }
					return Boolean(decay.acceleration >= t.acc && h && Game.TCount - t.activeAt >= t.time);
				},
				save: function(t) {
					return t.activeAt+'-'+(t.active?1:0);
				},
				load: function(t, str) {
					str = str.split('-');
					t.activeAt = parseFloat(str[0]);
					t.passed = Boolean(parseFloat(str[1]));
				},
				init: function(time, acc) {
					return {
						time: time,
						acc: acc,
						active: false,
						activeAt: 0
					};
				} 
			}
		}
		decay.quickCheck = function(obj, init) {
			if (typeof init === 'function') {
				return new decay.challengeChecker(obj.check, obj.save, obj.load, init());
			} else {
				return new decay.challengeChecker(obj.check, obj.save, obj.load, init);
			}
		}

		const optionalChallengeOrder = 900;
		addLoc('Nothing (optional challenge)');
		
		//DO NOT ADD CHALLENGES IN BETWEEN. Affix them at the end only and use the order argument (in the obj argument); if not, the save breaks
		addLoc('Get <b>all</b> Halloween cookies before acceleration reaches <b>x1.5</b>.');
		addLoc('You unleash <b>+12%</b> more prestige per Halloween or Christmas cookie'); 
		addLoc('Random drop chance <b>+15%</b>');
		addLoc('Improved by challenge <b>%1</b>! <b>+%2%</b> more prestige unleashed!');
		decay.checkHalloweenDrops = function() {
			if (decay.acceleration > 1.5) { return false; }
			for (let i in Game.halloweenDrops) { if (!Game.Has(Game.halloweenDrops[i])) { return false; } }
			return true;
		}
		decay.checkEasterDrops = function() {
			if (decay.acceleration > 1.55) { return false; }
			for (let i in Game.eggDrops) { if (!Game.Has(Game.eggDrops[i])) { return false; } } 
			return true;
		}
		new decay.challenge('seasonalCookies', loc('Get <b>all</b> Halloween cookies before acceleration reaches <b>x1.5</b>, or get <b>all</b> common (non-special) Easter eggs before acceleration reaches <b>x1.55</b>.'), function(c) { if (decay.acceleration > 1.55) { c.makeCannotComplete(); } return decay.checkHalloweenDrops() || decay.checkEasterDrops(); }, loc('You unleash <b>+12%</b> more prestige per Halloween or Christmas cookie') + '<br>' + loc('You unleash <b>+5%</b> more prestige per common Easter egg') + '<br>' + loc('You unleash <b>+10%</b> more prestige per rare Easter egg') + '<br>' + loc('Random drop chance <b>+25%</b>'), decay.challengeUnlockModules.box, { prereq: ['earthShatterer', 'powerClickWrinklers'], order: 33.5 });
		let improvementFunc = function() {
			if (!decay.challengeStatus('seasonalCookies')) { return this.ddesc; }
			return '<div style="text-align: center;">' + loc('Improved by challenge <b>%1</b>! <b>+%2%</b> more prestige unleashed!', [decay.challenges['seasonalCookies'].name, 12]) + '</div><div class="line"></div>' + this.ddesc;
		}
		for (let i in Game.halloweenDrops) {
			Game.Upgrades[Game.halloweenDrops[i]].descFunc = improvementFunc;
		}
		for (let i in Game.reindeerDrops) {
			Game.Upgrades[Game.reindeerDrops[i]].descFunc = improvementFunc;
		}
		addLoc('All eggs are <b>+50%</b> more common.');
		addLoc('Get <b>all</b> common (non-special) Easter eggs before acceleration reaches <b>x1.55</b>.');
		addLoc('You unleash <b>+5%</b> more prestige per common Easter egg'); addLoc('You unleash <b>+10%</b> more prestige per rare Easter egg');
		new decay.challenge('eggs', loc('Get <b>all</b> common (non-special) Easter eggs before acceleration reaches <b>x1.55</b>.'), function(c) { if (decay.acceleration > 1.55) { c.makeCannotComplete(); } for (let i in Game.eggDrops) { if (!Game.Has(Game.eggDrops[i])) { return false; } } return true; }, loc('You unleash <b>+5%</b> more prestige per common Easter egg') + '<br>' + loc('You unleash <b>+10%</b> more prestige per rare Easter egg') + '<br>' + loc('Random drop chance <b>+15%</b>'), decay.challengeUnlockModules.box, { deprecated: true, prereq: 'powerClickWrinklers', order: 32.5 });
		let eggImprovementFunc = function() {
			if (!decay.challengeStatus('seasonalCookies')) { return this.ddesc; }
			return '<div style="text-align: center;">' + loc('Improved by challenge <b>%1</b>! <b>+%2%</b> more prestige unleashed!', [decay.challenges['seasonalCookies'].name, 5]) + '</div><div class="line"></div>' + this.ddesc;
		}
		for (let i in Game.eggDrops) {
			Game.Upgrades[Game.eggDrops[i]].descFunc = eggImprovementFunc;
		}
		let rareEggImprovementFunc = function() {
			if (!decay.challengeStatus('seasonalCookies')) { return this.ddesc; }
			return '<div style="text-align: center;">' + loc('Improved by challenge <b>%1</b>! <b>+%2%</b> more prestige unleashed!', [decay.challenges['seasonalCookies'].name, 10]) + '</div><div class="line"></div>' + this.ddesc;
		}
		for (let i in Game.rareEggDrops) {
			Game.Upgrades[Game.rareEggDrops[i]].descFunc = rareEggImprovementFunc;
		}
		Game.Upgrades['Century egg'].descFunc = function() {
			return (decay.challengeStatus('seasonalCookies')?('<div style="text-align: center;">' + loc('Improved by challenge <b>%1</b>! <b>+%2%</b> more prestige unleashed!', [decay.challenges['seasonalCookies'].name, 10]) + '</div><div class="line"></div>'):'') + '<div style="text-align:center;">'+loc("Current boost:")+' <b>+'+Beautify((1-Math.pow(1-Math.min(Game.TCount / Game.fps / 3600 / 12, 1), 3))*0.25*100,1)+'%</b></div><div class="line"></div>'+this.ddesc;
		}
		eval('Game.dropRateMult='+Game.dropRateMult.toString().replace('return rate;', 'if (decay.challengeStatus("seasonalCookies")) { rate *= 1.25; } return rate;'))

		addLoc('The <b>Dragon Guts</b> aura is always slotted.'); addLoc('Wrinklers spawn closer to the big cookie and moves faster.'); addLoc('Your clicks halt decay <b>3 times</b> faster.'); addLoc('Bake <b>%1</b>.');
		new decay.challenge('knockbackTutorial', loc('The <b>Dragon Guts</b> aura is always slotted.') + '<br>' + loc('Wrinklers spawn closer to the big cookie and moves faster.') + '<br>' + loc('Your clicks halt decay <b>3 times</b> faster.') + '<br>' + loc('Bake <b>%1</b>.', loc('%1 cookie', Beautify(1e39))), function(c) { return (Game.cookiesEarned > 1e39); }, loc('Nothing (optional challenge)'), decay.challengeUnlockModules.box, { init: function() { decay.gameCan.slotAuras = false; Game.Upgrades['A crumbly egg'].earn(); Game.dragonLevel = 25; Game.dragonAura = 21; }, reset: function() { decay.gameCan.slotAuras = true; }, conditional: true, prereq: 'combo4', order: optionalChallengeOrder });
		addLoc('Switching your auras is <b>free</b> because you have the Dragon teddy bear.');
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`loc("The cost of switching your aura is <b>%1</b>.<br>This will affect your CpS!",loc("%1 "+highestBuilding.bsingle,LBeautify(1)))`, `(Game.Has('Dragon teddy bear')?loc('Switching your auras is <b>free</b> because you have the Dragon teddy bear.'):loc("The cost of switching your aura is <b>%1</b>.<br>This will affect your CpS!",loc("%1 "+highestBuilding.bsingle,LBeautify(1))))`).replace(`Game.ObjectsById['+highestBuilding.id+'].sacrifice(1);`, `if (!decay.challengeStatus("knockbackTutorial")) { Game.ObjectsById['+highestBuilding.id+'].sacrifice(1); }`));
		
		addLoc('Enchanted Permanent upgrade slot I'); addLoc('Rift to the beyond');
		new decay.challenge(1, decay.challengeDescModules.bakeAndKeep(1e18, 60), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e18, 60 * Game.fps)), '<span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Enchanted Permanent upgrade slot I')+'>' + loc('Enchanted Permanent upgrade slot I') + '</span><br><span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Rift to the beyond')+'>' + loc('Rift to the beyond') + '</span>', decay.challengeUnlockModules.vial, { prereq: 'combo1' }); addLoc('Enchanted Permanent upgrade slot II'); addLoc('Stabilizing crystal')
		new decay.challenge(2, decay.challengeDescModules.bakeAndKeep(1e27, 70), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e27, 70 * Game.fps)), '<span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Enchanted Permanent upgrade slot II')+'>' + loc('Enchanted Permanent upgrade slot II') + '</span><br><span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Stabilizing crystal')+'>' + loc('Stabilizing crystal') + '</span>', decay.challengeUnlockModules.vial, { prereq: 1 }); addLoc('Enchanted Permanent upgrade slot III'); addLoc('Thunder marker');
		new decay.challenge(3, decay.challengeDescModules.bakeAndKeep(1e33, 80), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e33, 80 * Game.fps)), '<span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Enchanted Permanent upgrade slot III')+'>' + loc('Enchanted Permanent upgrade slot III') + '</span><br><span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Thunder marker')+'>' + loc('Thunder marker') + '</span>', decay.challengeUnlockModules.box, { prereq: 2 }); addLoc('Enchanted Permanent upgrade slot IV');
		new decay.challenge(4, decay.challengeDescModules.bakeAndKeep(1e45, 90), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e45, 90 * Game.fps)), '<span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Enchanted Permanent upgrade slot IV')+'>' + loc('Enchanted Permanent upgrade slot IV') + '</span><br><span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Truck of challenges')+'>' + loc('Truck of challenges') + '</span>', decay.challengeUnlockModules.box, { prereq: 3 }); addLoc('Enchanted Permanent upgrade slot V');
		new decay.challenge(5, decay.challengeDescModules.bakeAndKeep(1e54, 30), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e54, 30 * Game.fps)), '<span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Enchanted Permanent upgrade slot V')+'>' + loc('Enchanted Permanent upgrade slot V') + '</span><br><span class="highlightHover underlined" '+decay.getUpgradeTooltipCSS('Choose your own wrinklers')+'>' + loc('Choose your own wrinklers') + '</span>', decay.challengeUnlockModules.truck, { prereq: 4 });
		
		addLoc('Bake <b>%1</b> with <b>no</b> normal upgrades <b>bought</b>.');
		addLoc('<b>Halved</b> flavored cookie cost');
		new decay.challenge('hc', loc('Bake <b>%1</b> with <b>no</b> normal upgrades <b>bought</b>.', loc('%1 cookie', Beautify(1e12))), function() { return Game.cookiesEarned >= 1e12; }, loc('<b>Halved</b> flavored cookie cost')+'<br>'+loc('Hardcore'), decay.challengeUnlockModules.vial, { deprecated: true, prereq: 'combo1', onCompletion: function() { Game.Win('Hardcore'); } });
		eval('Game.Upgrade.prototype.buy='+Game.Upgrade.prototype.buy.toString().replace('Game.Spend(price);', 'Game.Spend(price); if (this.pool != "toggle") { decay.challenges.hc.makeCannotComplete(); }'))
		
		addLoc('Activate the Elder Pledge in the first <b>%1</b> of the run.');
		addLoc('The <span class="highlightHover underlined" %1>Memory capsule</span> becomes <b>free</b>');
		addLoc('Unlocks the <b>Touch of force</b>');
		new decay.challenge('pledge', loc('Activate the Elder Pledge in the first <b>%1</b> of the run.', Game.sayTime(7.35 * 60 * Game.fps, -1)), function(c) { if (Game.TCount >= 7.35 * 60 * Game.fps) { c.makeCannotComplete(); return; } return Game.pledges>=1; }, loc('The <span class="highlightHover underlined" %1>Memory capsule</span> becomes <b>free</b>', decay.getUpgradeTooltipCSS('Memory capsule')) + '<br>' + loc('Research is <b>twice</b> as fast') + '<br>' + loc('Unlocks the <b>Touch of force</b>'), decay.challengeUnlockModules.vial, { prereq: 'combo2', onCompletion: function() { Game.Unlock('Touch of force'); Game.Unlock('Touch of force [ACTIVE]'); Game.Upgrades['Touch of force [ACTIVE]'].bought = 1; } });
		
		addLoc('Reach a base CpS multiplier from purity of at least <b>%1</b> with <b>no</b> spells casted.');
		addLoc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity');
		addLoc('Clicking halts decay <b>%1%</b> faster');
		addLoc('Improves the <span class="highlightHover underlined" %1>Molten piercer</span> to destroy wrinklers with one more layer');
		new decay.challenge('purity1', loc('Reach a base CpS multiplier from purity of at least <b>%1</b> with <b>no</b> spells casted.', '+700%'), function(c) { if (gp && gp.spellsCast > 0) { c.makeCannotComplete(); return; } return decay.gen >= 8; }, loc('Clicking halts decay <b>%1%</b> faster', 10) + '<br>' + loc('Improves the <span class="highlightHover underlined" %1>Molten piercer</span> to destroy wrinklers with one more layer', decay.getUpgradeTooltipCSS('Molten piercer')), decay.challengeUnlockModules.vial, { prereq: 'pledge' });
		
		addLoc('Reach the <b>Elfling</b> santa stage without ever spending any wrinkler souls.');
		addLoc('<span class="highlightHover underlined" %1>The golden hat</span> is <b>10 times</b> cheaper');
		new decay.challenge('buildingCount', loc('Reach the <b>Elfling</b> santa stage without ever spending any wrinkler souls.'), function(c) { return (Game.santaLevel >= 7); }, loc('<span class="highlightHover underlined" %1>The golden hat</span> is <b>10 times</b> cheaper', decay.getUpgradeTooltipCSS('A golden hat')) + '<br>' + loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.1'), function() { return decay.challengeUnlockModules.vial && Game.Upgrades['A golden hat']?.everBought; }, { prereq: 2, category: 'vial' });
		
		addLoc('Wrinklers approach the big cookie <b>%1</b> slower');
		addLoc('Only buy every other building type, starting from Grandmas, and bake <b>%1</b>.');
		new decay.challenge('buildingsAlternate', loc('Only buy every other building type, starting from Grandmas, and bake <b>%1</b>.', loc('%1 cookie', Beautify(1e18))), function() { return Game.cookiesEarned >= 1e18; }, loc('Wrinklers approach the big cookie <b>%1</b> slower', '10%') + '<br>' + loc('Clicking halts decay <b>%1%</b> faster', 15), decay.challengeUnlockModules.vial, { deprecated: true, prereq: 'hc', order: decay.challenges.hc.order + 0.5 });

		addLoc('Bake <b>%1</b> without popping any wrinklers.');
		addLoc('Your clicks are <b>%1</b> more effective against wrinklers');
		new decay.challenge('wrinkler1', loc('Bake <b>%1</b> without popping any wrinklers.', Beautify(1e20)), function(c) { if (Game.wrinklersPopped) { c.makeCannotComplete(); } return (Game.cookiesEarned >= 1e20); }, loc('Your clicks are <b>%1</b> more effective against wrinklers', '15%') + '<br>' + loc('Improves the <span class="highlightHover underlined" %1>Molten piercer</span> to destroy wrinklers with one more layer', decay.getUpgradeTooltipCSS('Molten piercer')), decay.challengeUnlockModules.vial, { deprecated: true, prereq: ['hc', 'combo1'] });

		addLoc('Bake <b>%1</b> without ever having any purity or clicking any golden cookies.');
		addLoc('Golden cookies are <b>%1</b> more effective in purifying decay');
		new decay.challenge('noGC1', loc('Bake <b>%1</b> without ever having any purity or clicking any golden cookies.', Beautify(2e28) + loc(' cookie')), function(c) { if (decay.gen > 1 || Game.goldenClicksLocal) { c.makeCannotComplete(); } return (Game.cookiesEarned >= 2e28); }, loc('Golden cookies are <b>%1</b> more effective in purifying decay', '15%'), function() { return false/*decay.challengeUnlockModules.box*/; }, { deprecated: true, prereq: ['combo2', 3] });
		
		addLoc('You gain <b>%1</b> click power but also gains <b>%2</b> required halt for each building you own. You cannot cast any spells.');
		addLoc('Bake <b>%1</b> cookies.');
		addLoc('You regenerate worship swaps <b>%1</b> times faster.');
		addLoc('You deal <b>%1%</b> more damage to power orbs.');
		new decay.challenge('godz', loc('You gain <b>%1</b> click power but also gains <b>%2</b> required halt for each building you own. You cannot cast any spells.', ['+1%', '+0.1%'])+'<br>'+loc('Bake <b>%1</b> cookies.', Beautify(2e26)), function() { return Game.cookiesEarned>=2e26; }, loc('You deal <b>%1%</b> more damage to power orbs.', 40) + '<br>' + loc('You regenerate worship swaps <b>%1</b> times faster.', 1.25), decay.challengeUnlockModules.never, { deprecated: true, prereq: 'earthShatterer', conditional: true, init: function() { decay.gameCan.castSpells = false; }, reset: function() { decay.gameCan.castSpells = true; } });
		Game.registerHook('cookiesPerClick', function(input) { if (decay.isConditional('godz')) { return input * (1 + Game.BuildingsOwned * 0.01); } return input; });
		
		addLoc('You start with the Shimmering veil turned on, but if the Shimmering veil collapses, force ascend. Having purity greatly heals the veil.');
		addLoc('While exhausted, wrinkler souls halt decay for <b>10%</b> longer');
		new decay.challenge('veil', loc('You start with the Shimmering veil turned on, but if the Shimmering veil collapses, force ascend. Having purity greatly heals the veil.')+'<br>'+loc('Bake <b>%1</b> cookies.', Beautify(1e33)), function() { return Game.cookiesEarned>=1e33; }, loc('While exhausted, wrinkler souls halt decay for <b>10%</b> longer') + '<br>' + loc('Wrinklers approach the big cookie <b>10%</b> slower'), function() { return decay.challengeUnlockModules.box && Game.Has('Shimmering veil'); }, { deprecated: true, prereq: ['powerClickWrinklers', 'earthShatterer'], category: 'box', conditional: true });
		
		addLoc('Reindeers spawn constantly, regardless of season, and massively amplify decay when clicked. Easy clicks and wrinklers are disabled.');
		new decay.challenge('reindeer', loc('Reindeers spawn constantly, regardless of season, and massively amplify decay when clicked. Easy clicks and wrinklers are disabled.')+'<br>'+loc('Bake <b>%1</b> cookies.', Beautify(1e27)), function() { return Game.cookiesEarned>=1e27; }, loc('Nothing (optional challenge)'), decay.challengeUnlockModules.box, { prereq: 'powerClickWrinklers', conditional: true, order: optionalChallengeOrder });
		eval('Game.shimmerTypes.reindeer.getTimeMod='+Game.shimmerTypes.reindeer.getTimeMod.toString().replace(`if (Game.Has('Reindeer season')) m=0.01;`, `if (Game.Has('Reindeer season')) { m=0.01; } else if (decay.isConditional('reindeer')) { m = 10000000000; }`)); //disables natural spawns
		eval('Game.shimmerTypes.reindeer.spawnConditions='+Game.shimmerTypes.reindeer.spawnConditions.toString().replace(`if (Game.season=='christmas')`, `if (Game.season=='christmas'||decay.isConditional('reindeer'))`));
		eval('Game.shimmerTypes.reindeer.initFunc='+Game.shimmerTypes.reindeer.initFunc.toString()
			.replace('var dur=4;', 'var dur=4; if (decay.isConditional("reindeer")) { dur *= Math.random() * 1.5 + 0.4; }')
			.replace(`if (Game.Has('Weighted sleighs')) dur*=2;`, `if (Game.Has('Weighted sleighs') && !decay.isConditional('reindeer')) dur*=2;`)
			.replace('me.sizeMult=1;', 'me.sizeMult=1; if (decay.isConditional("reindeer")) { me.sizeMult *= Math.random() + 0.33; }')
		);
		eval('Game.shimmerTypes.reindeer.updateFunc='+Game.shimmerTypes.reindeer.updateFunc.toString()
			.replace('1-me.life/(Game.fps*me.dur)', 'decay.isConditional("reindeer")?(me.life/(Game.fps*me.dur)):(1-me.life/(Game.fps*me.dur))')
			.replace(`scale('+(me.sizeMult*(1+Math.sin(me.id*0.53)*0.1))+')'`, `scale('+(me.sizeMult*(1+Math.sin(me.id*0.53)*0.1))+')'+(decay.isConditional("reindeer")?'scaleX(-1)':'')`)
			.replace(`Game.bounds.left`, `Game.bounds.left + (decay.isConditional('reindeer')?256:0)`)
		);
		decay.reindeerObj = {
			timer: 0,
			update: function() {
				this.timer -= 1 / Game.fps;
				if (this.timer <= 0) {
					new Game.shimmer('reindeer');
					this.timer = Math.min(0.75, 1 / decay.gen);
				}
			}
		};
		Game.registerHook('logic', function() { if (decay.isConditional('reindeer')) { decay.reindeerObj.update(); } });
		
		new decay.challenge('nc', loc("Make <b>%1</b> with <b>no</b> cookie clicks.",[loc("%1 cookie",LBeautify(1e4)),15]), function() { return (Game.cookieClicks<=15 && Game.cookiesEarned >= 10000)}, loc('Neverclick'), decay.challengeUnlockModules.never, { deprecated: true,order: -1, prereq: 'combo1', onCompletion: function() { Game.Win('Neverclick'); } });
		
		addLoc('Make <b>%1</b> with <b>no</b> cookie clicks or wrinkler pops.');
		new decay.challenge('tnc', loc("Make <b>%1</b> with <b>no</b> cookie clicks or wrinkler pops.",loc("%1 cookie",LBeautify(1e6))), function() { return (Game.cookieClicks==0 && Game.cookiesEarned >= 1000000 && Game.wrinklersPopped==0)}, loc('True neverclick'), decay.challengeUnlockModules.never, { deprecated: true, order: -1, prereq: 'nc', onCompletion: function() { Game.Win('True neverclick'); } });
		
		addLoc('Bake <b>%1</b>, but the game is rotated 180 degrees clockwise. Some things may stop working. You can ascend by hitting ctrl+A in this mode.');
		new decay.challenge('rotated', loc('Bake <b>%1</b>, but the game is rotated 180 degrees clockwise. Some things may stop working. You can ascend by hitting ctrl+A in this mode.', Beautify(1e15)), function() { return (Game.cookiesEarned >= 1e15); }, loc('Nothing (optional challenge)'), decay.challengeUnlockModules.box, { prereq: ['powerClickWrinklers', 'earthShatterer'], conditional: true, order: optionalChallengeOrder });
		decay.checkRotation = function() {
			if (decay.isConditional('rotated')) { l('game').style.transform = 'rotate(180deg)'; } else { l('game').style.transform = ''; }
		}
		Game.registerHook('check', decay.checkRotation); //checkrotation is called with clearConditional to prevent wacks
		//eval('Game.GetMouseCoords='+Game.GetMouseCoords.toString().replace('Game.mouseX=(posx-x)/Game.scale;', 'Game.mouseX=(posx-x)/Game.scale; if (decay.isConditional(\'rotated\')) { Game.mouseX = l(\'game\').offsetWidth - Game.mouseX; }').replace('Game.mouseY=(posy-y)/Game.scale;', 'Game.mouseY=(posy-y)/Game.scale; if (decay.isConditional(\'rotated\')) { Game.mouseY = l(\'game\').offsetHeight - Game.mouseY; }'));
		eval('Crumbs.canvas.prototype.setSelf='+Crumbs.canvas.prototype.setSelf.toString()
			.replace('this.l.width', 'const r = decay.isConditional("rotated"); this.l.width')
			.replace('Game.mouseX - this.l.getBoundingClientRect().left', '(r?this.l.offsetWidth:0) + (Game.mouseX - this.l.getBoundingClientRect().left) * (r?-1:1)')
			.replace('Game.mouseY - this.l.getBoundingClientRect().top + (App?0:32)', '(r?this.l.offsetHeight:0) + (Game.mouseY - this.l.getBoundingClientRect().top + (App?0:32)) * (r?-1:1)')
		);
		//the part where ctrl+A is put in the same section as script writer
		addLoc('Wrinklers have much more health, spawn much more often, and have a 50% chance to not drop souls, but wrinkler souls also give much more power and power orbs spawn much more frequently.');
		addLoc('Power clicking wrinklers deal <b>25%</b> more damage to all wrinklers');
		addLoc('You start each ascension with 1 power click worth of power and an Utenglobe filled with normal souls');
		addLoc('Milk is <b>10%</b> more powerful.');
		new decay.challenge('powerClickWrinklers', loc('Wrinklers have much more health, spawn much more often, and have a 50% chance to not drop souls, but wrinkler souls also give much more power and power orbs spawn much more frequently.') + '<br>' + loc('Bake <b>%1</b> cookies.', Beautify(1e25)), function() { return (Game.cookiesEarned >= 1e25); }, loc('Power clicking wrinklers deal <b>25%</b> more damage to all wrinklers') + '<br>' + loc('You start each ascension with 1 power click worth of power and an Utenglobe filled with normal souls') + '<br>' + loc('Milk is <b>10%</b> more powerful.'), decay.challengeUnlockModules.box, { conditional: true, prereq: 'combo3' });
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`milkMult*=Game.eff('milk');`, `milkMult*=Game.eff('milk'); if (decay.challengeStatus('powerClickWrinklers')) { milkMult *= 1.1; }`));
		addLoc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions. To compensate, decay is massively nerfed.');
		addLoc('Unlocks more codes in the Script writer, accessible by typing the name of the leading programmer.');
		new decay.challenge('typing', loc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions. To compensate, decay is massively nerfed.', Beautify(1e16)), function() { return (Game.cookiesEarned >= 1e16) }, loc('Unlocks more codes in the Script writer, accessible by typing the name of the leading programmer.'), function() { return (decay.challengeUnlockModules.truck() && Game.Has('Script writer')); }, { deprecated: true, conditional: true, category: 'truck', prereq: [5, 'dualcast'], init: function() { for (let i in decay.typingActions) { decay.typingActions[i].activate(); } for (let i in decay.gameCan) { decay.gameCan[i] = false; } }, reset: function() { for (let i in decay.typingActions) { decay.typingActions[i].deactivate(); } for (let i in decay.gameCan) { decay.gameCan[i] = true; } } });
		eval('Game.Prompt='+Game.Prompt.toString().replace(`if (str.indexOf('<noClose>')!=-1)`, `if (str.indexOf('<noClose>')!=-1 || decay.isConditional('typing') || decay.isConditional('typingR'))`));
		decay.gameCan = {
			click: true, //good
			popWrinklers: true, //good
			buyBuildings: true, //good
			sellBuildings: true, //good
			buyUpgrades: true, //good
			buyAllUpgrades: true, //good
			toggleUpgrades: true, //good
			scrollNews: true, //good
			interactSanta: true, //good
			interactDragon: true, //good
			popReindeer: true, //good
			popGC: true, //good
			slotAuras: true, //good
			closeNotifs: true, //good
			clickPowerOrbs: true, //good
			levelUpBuildings: true, //good
			openStats: true, //good
			viewMinigames: true, //good
			closeMinigames: true, //good
			castSpells: true, //good
			slotGods: true, //good
			plant: true, //good
			selectSeeds: true, //good
			useGardenTools: true, //good
			buyGoods: true, //good
			sellGoods: true, //good
			upgradeOffice: true, //doesnt work but its a pain to implement so whatever
			buyBrokers: true, //doesnt work but its a pain to implement so whatever
			takeLoans: true, //good
			changeTickspeed: true, //good
			refillMinigames: true, //good
			interactUtenglobe: true, //good
			upgradeUtenglobe: true, //good
			releaseSouls: true, //good
			releaseShinySouls: true, //good
			releasePhantomEssences: true, //good
			condenseSouls: true, //good
			toggleAutoClaim: true, //good
			togglePowerchannel: true //good
		}
		decay.copyGameCan = function() { 
			for (let i in decay.gameCan) {
				kaizoCookies.prepauseAllowanceSettings[i] = decay.gameCan[i];
			} 
		}
		decay.copyGameCan();
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].buy='+Game.Objects[i].buy.toString()
				.replace('var success=0;', 'var success=0; if (!decay.gameCan.buyBuildings) { return 0; }')
				.replace('this.bought++;', 'this.bought++; if (decay.onBuildingBuy(this)) { return; }')
			);
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace('var success=0;', 'var success=0; if (!decay.gameCan.sellBuildings) { return 0; }'));
			eval('Game.Objects["'+i+'"].switchMinigame='+Game.Objects[i].switchMinigame.toString().replace('if (!Game.isMinigameReady(this)) on=false;', 'if ((on && !decay.gameCan.viewMinigames) || (!on && !decay.gameCan.closeMinigames)) { return; } if (!Game.isMinigameReady(this)) on=false;'));
		}
		eval('Game.Upgrade.prototype.buy='+Game.Upgrade.prototype.buy.toString().replace('var cancelPurchase=0;', 'var cancelPurchase=0; if ((!decay.gameCan.buyUpgrades && this.pool != "toggle") || ((!decay.gameCan.toggleUpgrades && this.pool == "toggle"))) { return 0; }'));
		eval('Game.storeBuyAll='+Game.storeBuyAll.toString().replace(`if (!Game.Has('Inspired checklist'))`, `if (!Game.Has('Inspired checklist') || !decay.gameCan.buyAllUpgrades)`));
		Game.rebuildNews = function() {
			l('commentsText1').remove();
			var ele = document.createElement('div');
			ele.id = 'commentsText1';
			ele.classList.add('commentsText');
			ele.classList.add('risingUp');
			l('commentsText2').insertAdjacentElement('beforebegin', ele);
			AddEvent(l('commentsText1'), 'click', function() { Game.clickNewsTicker(true); });
			Game.tickerL = l('commentsText1');
		}
		Game.rebuildNews();
		eval('Game.CloseNotes='+Game.CloseNotes.toString().replace('Game.Notes=[];', 'if (!decay.gameCan.closeNotifs) { return; } Game.Notes=[];'));
		eval('Game.CloseNote='+Game.CloseNote.toString().replace('var me=Game.NotesById[id];', 'var me=Game.NotesById[id]; if (!decay.gameCan.closeNotifs && me.life) { return; }'));
		eval('Game.ClickSpecialPic='+Game.ClickSpecialPic.toString().replace(`(Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('Pet the dragon') && l('specialPic'))`, `(Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('Pet the dragon') && l('specialPic') && decay.gameCan.interactDragon)`));
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace(`if (on)`, `if (on && !(!decay.gameCan.interactDragon && Game.specialTab=='dragon') && !(!decay.gameCan.interactSanta && Game.specialTab=='santa'))`).replace(`if (Game.specialTab!='')`, `if (Game.specialTab!='' && !(!decay.gameCan.interactDragon && Game.specialTab=='dragon') && !(!decay.gameCan.interactSanta && Game.specialTab=='santa'))`));
		eval('Game.UpgradeDragon='+Game.UpgradeDragon.toString().replace('Game.dragonLevel<Game.dragonLevels.length-1 && Game.dragonLevels[Game.dragonLevel].cost()', 'Game.dragonLevel<Game.dragonLevels.length-1 && Game.dragonLevels[Game.dragonLevel].cost() && decay.gameCan.interactDragon'));
		eval('Game.UpgradeSanta='+Game.UpgradeSanta.toString().replace('Game.cookies>moni && Game.santaLevel<14', 'Game.cookies>moni && Game.santaLevel<14 && decay.gameCan.interactSanta'));
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace('var currentAura=0;', 'if (!decay.gameCan.interactDragon) { return; } var currentAura=0;'));
		eval('Game.SetDragonAura='+Game.SetDragonAura.toString().replace('Game.SelectingDragonAura=aura;', 'if (!decay.gameCan.slotAuras) { return; } Game.SelectingDragonAura=aura;'));
		eval('Game.UpdateSpecial='+Game.UpdateSpecial.toString().replace(`if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))`, `if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas') && ((decay.gameCan.interactDragon && Game.specialTabs[i]=='dragon') || (decay.gameCan.interactSanta && Game.specialTabs[i]=='santa')))`));
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('Game.loseShimmeringVeil', 'if ((this.type=="golden" && !decay.gameCan.popGC) || (this.type=="reindeer" && !decay.gameCan.popReindeer)) { return; } Game.loseShimmeringVeil'));
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace(`if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))`, `if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas') && decay.gameCan.popWrinklers)`));
		eval('Game.ShowMenu='+Game.ShowMenu.toString().replace(`if (!what || what=='') what=Game.onMenu;`, `if (what=='stats' && !decay.gameCan.openStats) { return; } if (!what || what=='') what=Game.onMenu;`));
		eval('Game.refillLump='+Game.refillLump.toString().replace('if (Game.lumps>=n && Game.canRefillLump())', 'if (Game.lumps>=n && Game.canRefillLump() && decay.gameCan.refillMinigames)'));
		
		decay.typingActions = [];
		decay.typingAction = function(keyword, action, actionStr, keywordStr, spaceSensitive, enabled) {
			this.keyword = keyword;
			this.action = action;
			addLoc(actionStr);
			this.actionStr = loc(actionStr);
			if (keywordStr) { addLoc(keywordStr); this.keywordStr = loc(keywordStr); } else { addLoc(keyword); this.keywordStr = loc(keyword); }
			if (enabled) { this.enabled = enabled; } else { this.enabled = true; }
			if (spaceSensitive) { this.spaceSensitive = spaceSensitive; } else { this.spaceSensitive = false; }
			this.SW = null;

			decay.typingActions.push(this);
		}
		decay.typingAction.prototype.activate = function() {
			if (this.enabled) { this.SW = new decay.SWCode(this.keyword, this.action, { spaceSensitive: this.spaceSensitive }); }
		}
		decay.typingAction.prototype.deactivate = function() {
			if (this.SW) {
				decay.SWCodes.splice(decay.SWCodes.indexOf(this.SW), 1);
			}
		}
		addLoc('View keywords');
		addLoc('You can delete everything you\'ve typed using the enter key.');
		decay.getTypingPrompt = function() {
			var str = '<id availableActions><noClose><h3 id="viewActionsHeader">'+loc('View keywords')+'</h3><div class="line"></div>'+loc('You can delete everything you\'ve typed using the enter key.')+'<div class="line"></div><div class="block" style="height: 500px; overflow-y: scroll;">';
			for (let i in decay.typingActions) {
				if (!decay.typingActions[i].enabled) { continue; }
				str += '<div class="singleChallenge">';
				str += '<div class="taskSection" style="width: 35%;"><b>' + decay.typingActions[i].keywordStr + '</b></div>';
				str += '<div class="rewardSection" style="width: 65%;">' + decay.typingActions[i].actionStr + '</div></div>';
			}
			str += '</div>';
			
			Game.Prompt(str, [], function() { l('prompt').style.width = '750px'; l('prompt').style.transform = 'translate(-33%, 0%)'; });
		}
		new decay.typingAction('help', decay.getTypingPrompt, 'Opens the help menu');
		new decay.typingAction('exit', Game.ClosePrompt, 'Closes the menu');
		addLoc('Clicked!');
		new decay.typingAction('click', function() { if (this.timer2) { clearTimeout(this.timer2); } if (this.timer3) { clearTimeout(this.timer3); } Game.BigCookieState = 1; decay.gameCan.click = true; Game.ClickCookie(); decay.gameCan.click = false; Game.Notify(loc('Clicked!'), '', 0, 0.5); this.timer2 = setTimeout(function() { Game.BigCookieState = 2; }, 20 + Math.random() * 25); this.timer3 = setTimeout(function() { Game.BigCookieState = 0; }, 60); }, 'Clicks the big cookie');
		new decay.typingAction('% a %', function(c) { var s = c[0].join(''); if (s=='buy') { var s = true; } else if (s=='sell') { var s = false; } else { return true; } c[1][0] = c[1][0].toUpperCase(); const a = c[1].join(''); if (Game.Objects[a]) { if (s) { decay.gameCan.buyBuildings = true; Game.Objects[a].buy(1); decay.gameCan.buyBuildings = false; } else { decay.gameCan.sellBuildings = true; Game.Objects[a].sell(1); decay.gameCan.sellBuildings = false; } return true; } else if (a.length > 25) { return true; } else { return false; }}, 'Buys or sells 1 of the corresponding building', '[buy/sell] a [building name]', true);
		//bit of a problem with memory potentially as the content gets inflated beyond measure
		//ah well
		Game.ObjectsByPlural = {};
		for (let i in Game.Objects) {
			Game.ObjectsByPlural[Game.Objects[i].plural] = Game.Objects[i];
		}
		Game.UpgradesLowercase = {};
		new decay.typingAction('% 10 %', function(c) { var s = c[0].join(''); if (s=='buy') { var s = true; } else if (s=='sell') { var s = false; } else { return true; } const a = c[1].join(''); if (Game.ObjectsByPlural[a]) { if (s) { decay.gameCan.buyBuildings = true; Game.ObjectsByPlural[a].buy(10); decay.gameCan.buyBuildings = false; } else { decay.gameCan.sellBuildings = true; Game.ObjectsByPlural[a].sell(10); decay.gameCan.sellBuildings = false; } return true; } else if (a.length > 25) { return true; } else { return false; }}, 'Buy or sell 10 of the corresponding building', '[buy/sell] 10 [building name plural]', true);
		new decay.typingAction('% 100 %', function(c) { var s = c[0].join(''); if (s=='buy') { var s = true; } else if (s=='sell') { var s = false; } else { return true; } const a = c[1].join(''); if (Game.ObjectsByPlural[a]) { if (s) { decay.gameCan.buyBuildings = true; Game.ObjectsByPlural[a].buy(100); decay.gameCan.buyBuildings = false; } else { decay.gameCan.sellBuildings = true; Game.ObjectsByPlural[a].sell(100); decay.gameCan.sellBuildings = false; } return true; } else if (a.length > 25) { return true; } else { return false; }}, 'Buy or sell 100 of the corresponding building', '[buy/sell] 100 [building name plural]', true);
		Game.compileLowerCasedUpgrades = function() {
			//supposed to be only called once
			for (let i in Game.Upgrades) {
				Game.UpgradesLowercase[i.toLowerCase()] = Game.Upgrades[i];
			}	
			//eval('Game.Upgrade='+Game.Upgrade.toString().replace(`Game.Upgrades[this.name]=this;`, `Game.Upgrades[this.name]=this; Game.UpgradesLowercase[this.name.toLowerCase()] = this;`));
		}
		//function call put at the very end of the init
		addLoc('Couldn\'t buy upgrade');
		decay.unskippableUpgrades = [];
		decay.createUnskippables = function() {
			decay.unskippableUpgrades = decay.unskippableUpgrades.concat([Game.Upgrades['Wheat slims'], Game.Upgrades['Elderwort biscuits'], Game.Upgrades['Bakeberry cookies'], Game.Upgrades['Ichor syrup'], Game.Upgrades['Fern tea']]);
			decay.unskippableUpgrades = decay.unskippableUpgrades.concat([Game.Upgrades['Milk chocolate butter biscuit'], Game.Upgrades['Dark chocolate butter biscuit'], Game.Upgrades['White chocolate butter biscuit'], Game.Upgrades['Ruby chocolate butter biscuit'], Game.Upgrades['Lavender chocolate butter biscuit'], Game.Upgrades['Synthetic chocolate green honey butter biscuit'], Game.Upgrades['Royal raspberry chocolate butter biscuit'], Game.Upgrades['Ultra-concentrated high-energy chocolate butter biscuit'], Game.Upgrades['Pure pitch-black chocolate butter biscuit'], Game.Upgrades['Cosmic chocolate butter biscuit'], Game.Upgrades['Butter biscuit (with butter)'], Game.Upgrades['Everybutter biscuit'], Game.Upgrades['Personal biscuit']]);
		}
		new decay.typingAction('purchase %', function(c) { const a = c[0].join(''); const u = Game.UpgradesLowercase[a]; if (u && u.pool != 'toggle' && u.pool != 'prestige' && u.pool != 'debug' && !(u.pool == 'tech' && !u.unlocked) && !(decay.unskippableUpgrades.indexOf(u) != -1 && !u.unlocked)) { decay.gameCan.buyUpgrades = true; if (!Game.UpgradesLowercase[a].buy()) { Game.Notify(loc('Couldn\'t buy upgrade'), '', 0, 2); } decay.gameCan.buyUpgrades = false; return true; } else if (a.length > 60) { return true; } else { return false; }}, 'Buy the upgrade', 'purchase [upgrade name]', true);
		new decay.typingAction('buy all upgrades', function() { decay.gameCan.buyAllUpgrades = true; decay.gameCan.buyUpgrades = true; Game.storeBuyAll(); decay.gameCan.buyAllUpgrades = false; decay.gameCan.buyUpgrades = false; }, 'Buy all upgrades');
		decay.toggleUpgradesMap = [];
		decay.createToggleMap = function() { decay.toggleUpgradesMap = decay.toggleUpgradesMap.concat([{name: 'shimmering veil', upgradeOn: Game.Upgrades['Shimmering veil [off]'], upgradeOff: Game.Upgrades['Shimmering veil [on]']},
			{name: 'golden switch', upgradeOn: Game.Upgrades['Golden switch [off]'], upgradeOff: Game.Upgrades['Golden switch [on]']},
			{name: 'sugar frenzy', upgradeOn: Game.Upgrades['Sugar frenzy'], upgradeOff: Game.Upgrades['Sugar frenzy']},
			{name: 'festive biscuit', upgradeOn: Game.Upgrades['Festive biscuit'], upgradeOff: Game.Upgrades['Festive biscuit']},
			{name: 'ghostly biscuit', upgradeOn: Game.Upgrades['Ghostly biscuit'], upgradeOff: Game.Upgrades['Ghostly biscuit']},
			{name: 'lovesick biscuit', upgradeOn: Game.Upgrades['Lovesick biscuit'], upgradeOff: Game.Upgrades['Lovesick biscuit']},
			{name: 'fool\'s biscuit', upgradeOn: Game.Upgrades['Fool\'s biscuit'], upgradeOff: Game.Upgrades['Fool\'s biscuit']},
			{name: 'bunny biscuit', upgradeOn: Game.Upgrades['Bunny biscuit'], upgradeOff: Game.Upgrades['Bunny biscuit']},
			{name: 'golden cookie sound selector', choice: true, upgrade: Game.Upgrades['Golden cookie sound selector']},
			{name: 'jukebox', choice: true, upgrade: Game.Upgrades['Jukebox']},
			{name: 'milk selector', choice: true, upgrade: Game.Upgrades['Milk selector']},
			{name: 'background selector', choice: true, upgrade: Game.Upgrades['Background selector']},
			{name: 'elder pledge', upgradeOn: Game.Upgrades['Elder Pledge'], upgradeOff: Game.Upgrades['Elder Pledge']},
			{name: 'elder covenant', upgradeOn: Game.Upgrades['Elder Covenant'], upgradeOff: Game.Upgrades['Elder Covenant']}
		]); }
		if (Game.ready) { decay.createToggleMap(); decay.createUnskippables(); } else { Game.registerHook('create', function() { decay.createToggleMap(); decay.createUnskippables(); })}
		addLoc('Couldn\'t toggle switch');
		decay.toggleUpgradeFromType = function(c) {
			if (c.length > 25) { return true; }
			var obj = null;
			for (let i in decay.toggleUpgradesMap) {
				if (decay.toggleUpgradesMap[i].name == c) { obj = decay.toggleUpgradesMap[i]; }
			}
			if (!obj) { return false; }
			decay.gameCan.toggleUpgrades = true; decay.gameCan.buyUpgrades = true;
			if (obj.choice) {
				if (!obj.upgrade.unlocked) { decay.gameCan.toggleUpgrades = false; decay.gameCan.buyUpgrades = false; return true; }
				if (!obj.upgrade.buy()) { }
			} else {
				if (obj.upgradeOn.unlocked) { 
					if (!obj.upgradeOn.buy()) { if (obj.upgradeOff.unlocked) { obj.upgradeOff.buy(); } } 
				} else if (obj.upgradeOff.unlocked) {
					if (!obj.upgradeOff.buy()) { } 
				}
			}
			decay.gameCan.toggleUpgrades = false; decay.gameCan.buyUpgrades = false;
			return true; 
		}
		new decay.typingAction('toggle %', function(c) { return decay.toggleUpgradeFromType(c[0].join('')); }, 'Toggles the switch', 'toggle [switch name]', true);
		Game.clickNewsTicker = function() {
			if (!decay.gameCan.scrollNews) { return false; }
			
			Game.TickerClicks++;
			if (Game.windowW<Game.tickerTooNarrow) {Game.Win('Stifling the press');}
			else if (Game.TickerClicks>=50) {Game.Win('Tabloid addiction');}
			
			if (Game.TickerEffect && Game.TickerEffect.type=='fortune')
			{
				PlaySound('snd/fortune.mp3',1);
				Game.SparkleAt(Game.mouseX,Game.mouseY);
				var effect=Game.TickerEffect.sub;
				if (effect=='fortuneGC')
				{
					Game.Notify(loc("Fortune!"),loc("A golden cookie has appeared."),[10,32]);
					Game.fortuneGC=1;
					var newShimmer=new Game.shimmer('golden',{noWrath:true});
				}
				else if (effect=='fortuneCPS')
				{
					Game.Notify(loc("Fortune!"),loc("You gain <b>one hour</b> of your CpS (capped at double your bank)."),[10,32]);
					Game.fortuneCPS=1;
					Game.Earn(Math.min(Game.cookiesPs*60*60,Game.cookies));
				}
				else
				{
					Game.Notify(effect.dname,loc("You've unlocked a new upgrade."),effect.icon);
					effect.unlock();
				}
			}
			
			Game.TickerEffect=0;
			Game.getNewTicker(true);
		}
		new decay.typingAction('flip to next page', function() { decay.gameCan.scrollNews = true; Game.clickNewsTicker(true); decay.gameCan.scrollNews = false; }, 'Scrolls the news ticker');
		new decay.typingAction('open stats', function() { decay.gameCan.openStats = true; Game.ShowMenu('stats'); decay.gameCan.openStats = false; }, 'Opens/closes the stats menu<br>(typing is not required to open any other menus)');
		new decay.typingAction('confirm ascend', function() { decay.forceAscend(false); }, 'Ascends');
		new decay.typingAction('ding ding reindeer begone', function() { for (let i in Game.shimmers) { if (Game.shimmers[i].type=='reindeer') { decay.gameCan.popReindeer = true; Game.shimmers[i].pop(); decay.gameCan.popReindeer = false; break; }}}, 'Pops a reindeer');
		new decay.typingAction('pop % cookie at % section of screen', function(c) { const type = c[0].join(''); if (type != 'golden' && type != 'wrath') { return true; } const a = c[1].join(''); var b = 0; var c = 0; if (a=='left') { b=0;c=1/3; } else if (a=='middle') { b=1/3;c=2/3; } else if (a=='right') { b=2/3;c=1; } else { return; } const length = l('game').offsetWidth; for (let i in Game.shimmers) { if (Game.shimmers[i].x>b*length && Game.shimmers[i].x<c*length && ((!Game.shimmers[i].wrath && type=='golden') || (Game.shimmers[i].wrath && type=='wrath'))) { decay.gameCan.popGC = true; Game.shimmers[i].pop(); decay.gameCan.popGC = false; return; } }}, 'Clicks a golden or wrath cookie at that one third of the screen', 'pop [golden/wrath] cookie at [left/middle/right] section of screen');
		new decay.typingAction('open santa', function() { if (!Game.Has('A festive hat')) { return; } decay.gameCan.interactSanta = true; Game.specialTab = 'santa'; Game.ClickSpecialPic(); Game.ToggleSpecialMenu(true); decay.gameCan.interactSanta = false; }, 'opens Santa, if available');
		new decay.typingAction('close santa', function() { if (Game.specialTab=='santa') { decay.gameCan.interactSanta = true; Game.ToggleSpecialMenu(false); decay.gameCan.interactSanta = false; } }, 'closes Santa');
		new decay.typingAction('open krumblor', function() { if (!Game.Has('A crumbly egg')) { return; } decay.gameCan.interactDragon = true; Game.specialTab = 'dragon'; Game.ClickSpecialPic(); Game.ToggleSpecialMenu(true); decay.gameCan.interactDragon = false; }, 'opens Krumblor, cookie dragon, if available');
		new decay.typingAction('close krumblor', function() { if (Game.specialTab=='dragon') { decay.gameCan.interactDragon = true; Game.ToggleSpecialMenu(false); decay.gameCan.interactDragon = false; } }, 'closes Krumblor, cookie dragon');
		addLoc('Santa leveling...');
		new decay.typingAction('level up santa', function() { Game.Notify('Santa leveling...', '', 0, 2); if (Game.specialTab=='santa') { decay.gameCan.interactSanta = true; Game.UpgradeSanta(); decay.gameCan.interactSanta = false; } }, 'if Santa is open, level up the santa');
		addLoc('Krumblor evolving...');
		new decay.typingAction('evolve krumblor', function() { Game.Notify('Krumblor evolving...', '', 0, 2); if (Game.specialTab=='dragon') { decay.gameCan.interactDragon = true; Game.UpgradeDragon(); decay.gameCan.interactDragon = false; } }, 'if Krumblor, cookie dragon is open, evolve it');
		new decay.typingAction('open first aura for selection', function() { if (Game.dragonLevel <= 4) { return; } decay.gameCan.interactDragon = true; Game.SelectDragonAura(0); decay.gameCan.interactDragon = false; }, 'if possible, prompt to select first aura');
		new decay.typingAction('open second aura for selection', function() { if (!Game.dragonLevel <= 26) { return; } decay.gameCan.interactDragon = true; Game.SelectDragonAura(1); decay.gameCan.interactDragon = false; }, 'if possible, prompt to select second aura');
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`'<div style="text-align:center;">'`, `'<div style="text-align:center;" id="dragonAurasMenu'+slot+'">'`));
		Game.dragonAurasBNLowercase = {};
		Game.compiledLowercasedDragonAuras = function() {
			for (let i in Game.dragonAurasBN) {
				Game.dragonAurasBNLowercase[i.toLowerCase()] = Game.dragonAurasBN[i];
			}
		}
		new decay.typingAction('slot %', function(c) { if (l('dragonAurasMenu0') || l('dragonAurasMenu1')) { var slot = 0; if (l('dragonAurasMenu1')) { slot = 1; } const auraCount = l('dragonAurasMenu'+slot).childNodes.length; const a = c[0].join(''); if (Game.dragonAurasBNLowercase[a]) { if (auraCount<Game.dragonAurasBNLowercase[a].id) { return true; } else { decay.gameCan.slotAuras = true; Game.SetDragonAura(Game.dragonAurasBNLowercase[a].id, slot); decay.gameCan.slotAuras = false; l('promptOption0').click(); return true; } } else if (a.length>=30) { return true; } else { return false; } } }, 'if on aura selection prompt, selects and confirms the aura', 'slot [dragon aura name]', true);
		new decay.typingAction('close all notifications', function() { decay.gameCan.closeNotifs = true; Game.CloseNotes(); decay.gameCan.closeNotifs = false; }, 'Closes all active notifications');
		new decay.typingAction('using lumps level up %', function(c) { const a = c[0].join(''); if (Game.ObjectsByPlural[a]) { decay.gameCan.levelUpBuildings = true; Game.ObjectsByPlural[a].levelUp(); decay.gameCan.levelUpBuildings = false; } else if (a.length >= 20) { return true; } else { return false; } }, 'levels up the building', 'using lumps level up [building name plural]', true);
		new decay.typingAction('pop', function() { for (let i in Game.wrinklers) { if (Game.wrinklers[i].selected) { Game.wrinklers[i].hp -= decay.wrinklerResistance * 7; Game.wrinklers[i].hurt = 4 * (Math.random() - 0.5); break; } } }, 'seven clicks on currently selected wrinkler');
		new decay.typingAction('pow', function() { decay.gameCan.clickPowerOrbs = true; for (let i in decay.powerOrbs) { if (decay.powerOrbs[i].selected) { decay.powerOrbs[i].onClick(decay.powerOrbs[i]); decay.times.sinceOrbClick = 0; break; } } decay.gameCan.clickPowerOrbs = false; }, 'clicks on currently hovered over power orb');
		Game.minigames = []; //minigame objects pushed into it on minigame changes hooks
		new decay.typingAction('view %', function(c) { const a = c[0].join(''); for (let i in Game.minigames) { if (a==Game.minigames[i].name.toLowerCase()) { decay.gameCan.viewMinigames = true; Game.minigames[i].parent.switchMinigame(true); decay.gameCan.viewMinigames = false; } } if (a.length>12) { return true; } else { return false; }}, 'opens the minigame', 'view [minigame name]', true);
		new decay.typingAction('close %', function(c) { const a = c[0].join(''); for (let i in Game.minigames) { if (a==Game.minigames[i].name.toLowerCase()) { decay.gameCan.closeMinigames = true; Game.minigames[i].parent.switchMinigame(false); decay.gameCan.closeMinigames = false; } } if (a.length>12 || a=='krumblor' || a=='santa') { return true; } else { return false; }}, 'closes the minigame', 'close [minigame name]', true);
		Game.spellsProperNameToCode = {}; //properly set in the grimoire hooks
		new decay.typingAction('cast %', function(c) { if (!gp) { return; } const a = c[0].join(''); if (Game.spellsProperNameToCode[a]) { decay.gameCan.castSpells = true; gp.castSpell(gp.spells[Game.spellsProperNameToCode[a]]); decay.gameCan.castSpells = false; } if (a.length>=30) { return true; } else { return false; }}, 'casts the spell in the Grimoire', 'cast [spell name]', true);
		Game.godsPrimaryNameToCode = {}; //once again set in the pantheon hook
		new decay.typingAction('slot % into % position', function(c) { if (!pp) { return; } const a = c[0].join(''); const b = c[1].join(''); var d = -1; if (b=='diamond') { d = 0; } else if (b=='ruby') { d = 1; } else if (b=='jade') { d = 2; } else if (b=='roster') { d = -1; } else { return true; } if (Game.godsPrimaryNameToCode[a]) { decay.gameCan.slotGods = true; pp.dragging = pp.gods[Game.godsPrimaryNameToCode[a]]; pp.slotHovered = d; pp.dropGod(); pp.slotHovered = -1; decay.gameCan.slotGods = false; } }, 'slots the corresponding god into the corresponding slot, or puts it back into the roster', 'slot [god primary name] to [diamond/ruby/jade/roster] slot<br>(primary name excludes the title, e.g. "Mokalsium, Mother Spirit" to "mokalsium")', true);
		new decay.typingAction('take loan %', function(c) { if (!sp) { return; } if (c[0].length > 1) { return true; } const a = parseInt(c[0][0]); var sp = Game.Objects.Bank.minigame; if (a>3 || a<1) { return true; /*no checks for loan unlocks here for funny*/} decay.gameCan.takeLoans = true; sp.takeLoan(a); decay.gameCan.takeLoans = false; }, 'takes the loan in the Stock market, if available', 'take loan [loan number]', true);
		new decay.typingAction('hire a broker', function() { if (!sp) { return; } decay.gameCan.buyBrokers = true; l('bankBrokersBuy').click(); decay.gameCan.buyBrokers = false; }, 'hires a broker in the Stock market');
		decay.manipGoods = function(action, amount, name) {
			if (!Game.Objects.Bank.minigameLoaded) { return true; }
			if (!(action=='buy' || action=='sell')) { return true; }
			if (amount=='all' || amount=='max') { amount = '10000'; } 
			amount = parseFloat(amount); //ahah funny
			var sp = Game.Objects.Bank.minigame;
			for (let i in sp.goods) {
				if (sp.goods[i].name.toLowerCase() == name) {
					if (action=='buy') {
						if (sp.buyGood(sp.goods[i].id, amount)) { Game.SparkleOn(sp.goods[i].stockBoxL); }
					} else if (action=='sell') {
						if (sp.sellGood(sp.goods[i].id, amount)) { Game.SparkleOn(sp.goods[i].stockBoxL); }
					}
					return true;
				}
			}
			return false;
		}
		new decay.typingAction('stock % % of %', function(c) { if (!sp) { return; } const x = c[0].join(''); const y = c[1].join(''); const z = c[2].join(''); if (z.length>20) { return true; } decay.gameCan.buyGoods = true; decay.gameCan.sellGoods = true; const toReturn = decay.manipGoods(x, y, z); decay.gameCan.buyGoods = false; decay.gameCan.sellGoods = false; return toReturn; }, 'buys or sells that quantity of a goods in the Stock market', 'stock [buy/sell] [1/10/100/max/all] of [the goods\' proper name]', true);
		new decay.typingAction('upgrade your office', function() { if (!sp) { return; } decay.gameCan.upgradeOffice = true; l('bankOfficeUpgrade').click(); decay.gameCan.upgradeOffice = false; }, 'upgrades the office in the Stock market');
		new decay.typingAction('change tickspeed', function() { if (!sp) { return; } decay.gameCan.changeTickspeed = true; sp.changeTickspeed(); decay.gameCan.changeTickspeed = false; }, 'changes the tickspeed in the Stock market');
		new decay.typingAction('refill magic', function() { if (!gp) { return; } decay.gameCan.refillMinigames = true; l('grimoireLumpRefill').click(); decay.gameCan.refillMinigames = false; }, 'refills magic in the Grimoire using a sugar lump');
		new decay.typingAction('refill worship swaps', function() { if (!pp) { return; } decay.gameCan.refillMinigames = true; l('templeLumpRefill').click(); decay.gameCan.refillMinigames = false; }, 'refills worship swaps in the Pantheon using a sugar lump');
		new decay.typingAction('supercharge garden', function() { if (!gap) { return; } decay.gameCan.refillMinigames = true; l('gardenLumpRefill').click(); decay.gameCan.refillMinigames = false; }, 'activates the sugar lump ability (not sacrifice garden) in the Garden');
		new decay.typingAction('garden use %', function(c) { if (!gap) { return; } const a = c[0].join(''); decay.gameCan.useGardenTools = true; var tr = false; if (a=='harvest all') { gap.tools.harvestAll.func(); tr = true; } else if (a=='freeze') { gap.tools.freeze.func(); tr = true; } else if (a=='sacrifice garden') { gap.tools.convert.func(); tr = true; } else if (a.length>15) { tr = true; } decay.gameCan.useGardenTools = false; return tr; }, 'uses the garden tool as if clicking on it', 'garden use [garden tool name]', true);
		new decay.typingAction('select %', function(c) { c[0][0] = c[0][0].toUpperCase(); const a = c[0].join(''); for (let i in gap.plants) { if (gap.plants[i].name == a && gap.plants[i].unlocked) { decay.gameCan.selectSeeds = true; l('gardenSeed-'+gap.plants[i].id).click(); decay.gameCan.selectSeeds = false; return true; } } if (a.length>15) { return true; } else { return false; } }, 'selects or unselects the seed corresponding to the plant, if possible', 'select [garden plant name]', true);
		new decay.typingAction('plant', function() { if (gap.selectedTile[0] == -1 || gap.seedSelected == -1 || !gap.plot[gap.selectedTile[1]][gap.selectedTile[0]][0]) { return; } decay.gameCan.plant = true; gap.clickTile(gap.selectedTile[0], gap.selectedTile[1]); if (!M.canPlant(gap.plantsById[gap.seedSelected])) { Game.Notify('Seed is too expensive!', '', 0, 2.5); } decay.gameCan.plant = false; }, 'plants the currently selected seed on currently hovered over tile');
		new decay.typingAction('uproot', function() { if (gap.selectedTile[0] == -1 || gap.plot[gap.selectedTile[1]][gap.selectedTile[0]][0]) { return; } decay.gameCan.plant = true; gap.clickTile(gap.selectedTile[0], gap.selectedTile[1]); decay.gameCan.plant = false; }, 'uproots the currently hovered over plant');

		addLoc('Bake <b>%1</b>, but power passively accumulates with speed scaling with current acceleration. In addition, the duration of Power surge buff decreases with acceleration. Upon reaching maximum power click capacity, force ascend.');
		addLoc('Power poked duration <b>+%1%</b>.');
		addLoc('Power poked strength <b>+%1%</b>.');
		addLoc('You gain <b>+%1%</b> power.');
		new decay.challenge('power', loc('Bake <b>%1</b>, but power passively accumulates with speed scaling with current acceleration. In addition, the duration of Power surge buff decreases with acceleration. Upon reaching maximum power click capacity, force ascend.', Beautify(1e16)), function() { return (Game.cookiesEarned >= 1e16) }, loc('Power poked strength <b>+%1%</b>.', '10') + '<br>' + loc('You gain <b>+%1%</b> power.', 50), /*decay.challengeUnlockModules.box*/ function() { return false; }, {conditional: true/*, prereq: ['comboGSwitch', 'powerClickWrinklers']*/ });
		
		addLoc('Bake <b>%1</b>.');
		new decay.challenge('bakeR', function(c) { return loc('Bake <b>%1</b>.', Beautify(1e12 * Math.pow(100, c)))+(c?'<br>'+loc('Completions: ')+'<b>'+Beautify(c)+'</b>':''); }, function(c) { return (Game.cookiesEarned >= 1e12 * Math.pow(100, c.complete)); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.05'), decay.challengeUnlockModules.truck, { order: 1000, prereq: 5, repeatable: true });
		
		addLoc('Fortunes appear <b>%1</b> more often.');
		addLoc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions.');
		new decay.challenge('typingR', function(c) { return loc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions.', Beautify(1e11 * Math.pow(100, c)))+(c?'<br>'+loc('Completions: ')+'<b>'+Beautify(c)+'</b>':''); }, function(c) { return (Game.cookiesEarned >= 1e11 * Math.pow(100, c.complete)); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.05') + '<br>' + loc('Fortunes appear <b>%1</b> more often.', '20%'), decay.challengeUnlockModules.never, { deprecated: true, order: 1001, prereq: 'typing', repeatable: true, conditional: true, category: 'truck', init: function() { for (let i in decay.typingActions) { decay.typingActions[i].activate(); } for (let i in decay.gameCan) { decay.gameCan[i] = false; } }, reset: function() { for (let i in decay.typingActions) { decay.typingActions[i].deactivate(); } for (let i in decay.gameCan) { decay.gameCan[i] = true; } } });
		
		eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(`(Game.HasAchiev('O Fortuna')?0.04:0.02)`, `((Game.HasAchiev('O Fortuna')?0.06:0.04)*(1 + 0.2 * decay.challengeStatus('typingR')))`)); //incredible gaming, just need to make sure no one gets the challenge done 96 times lol lmao
		//comboing tutorial
		addLoc('Get a <b>Click frenzy</b> in the first <b>%1</b> of the run.');
		addLoc('(Note: Click frenzies cannot be gotten from <b>naturally</b> spawning Golden cookies or Wrath cookies in this mod)')
		addLoc('Click frenzy from Force the Hand of Fate Grimoire spell <b>base</b> chance <b>%1</b> --> <b>%2</b>');
		addLoc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run');
		new decay.challenge('combo1', loc('Get a <b>Click frenzy</b> in the first <b>%1</b> of the run.', Game.sayTime(10 * 60 * Game.fps)) + '<br>' + loc('(Note: Click frenzies cannot be gotten from <b>naturally</b> spawning Golden cookies or Wrath cookies in this mod)'), function(c) { if (Game.TCount >= 600 * Game.fps) { c.makeCannotComplete(); } return Game.hasBuff('Click frenzy'); }, function(hide) { return loc('Click frenzy from Force the Hand of Fate Grimoire spell <b>base</b> chance <b>%1</b> --> <b>%2</b>', ['100%', '125%']) + '<br>' + loc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run', ['+' + Beautify(909) + '%', 'CpS']) + (hide?'':(' ' + loc('(Currently: <b>%1</b>)', '+'+Beautify(909 / (Math.max(Game.log10Cookies - 10, 0) / 2 + 1))+'%'))); }, decay.challengeUnlockModules.vial);
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`!Game.hasBuff('Dragonflight')`, `false`));
		
		addLoc('Get a <b>Click frenzy</b> and a <b>Frenzy</b> (or any other golden cookie buff) active simultaneously in the first <b>%1</b> of the run.');
		//addLoc('(Golden cookies not spawning fast enough? Maybe your permanent upgrade slots can help with that...)');
		addLoc('(does not contribute to future click power multiplier checks)');
		addLoc('<span class="highlightHover underlined" %1>Lucky day</span> no longer resets on ascension');
		addLoc('(Currently: <b>%1</b>)');
		new decay.challenge('combo2', loc('Get a <b>Click frenzy</b> and a <b>Frenzy</b> (or any other golden cookie buff) active simultaneously in the first <b>%1</b> of the run.', Game.sayTime(4.5 * 60 * Game.fps, -1)), function(c) { if (Game.TCount >= 270 * Game.fps) { c.makeCannotComplete(); } return (Game.hasBuff('Click frenzy') && Game.gcBuffCount() >= 2); }, function(hide) { return loc('<span class="highlightHover underlined" %1>Lucky day</span> no longer resets on ascension', decay.getUpgradeTooltipCSS('Lucky day')) + '<br>' + loc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run', ['+' + Beautify(909) + '%', 'click power']) + ' ' + loc('(does not contribute to future click power multiplier checks)') + (hide?'':(' '+loc('(Currently: <b>%1</b>)', '+'+Beautify(909 / (Math.max(Game.log10Cookies - 12, 0) / 5 + 1))+'%'))) }, decay.challengeUnlockModules.vial, { onCompletion: function() { decay.triggerNotif('combos'); }, prereq: 'combo1' });
		Game.registerHook('cookiesPerClick', function(out) { if (decay.challengeStatus('combo2')) { return out * (1 + 9.09 / (Math.max(Game.log10Cookies - 12, 0) / 5 + 1)); } return out; });
		
		addLoc('Get a <b>direct</b> click power multiplier of at least <b>x%1</b> in the first <b>%2</b> of the run.');
		addLoc('Slotting gods in the Pantheon has a <b>%1%</b> chance to not use any worship swaps');
		new decay.challenge('combo3', loc('Get a <b>direct</b> click power multiplier of at least <b>x%1</b> in the first <b>%2</b> of the run.', [Beautify(7000), Game.sayTime(4 * 60 * Game.fps)]), function(c) { if (Game.TCount >= 240 * Game.fps) { c.makeCannotComplete(); } return (Game.clickMult >= 7000); }, function(hide) { return loc('Slotting gods in the Pantheon has a <b>%1%</b> chance to not use any worship swaps', 10) + '<br>' + loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '2'); }, decay.challengeUnlockModules.vial, { prereq: 'combo2' });
		//eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`if (Game.Has('Dragon fang')) mult*=1.03;`, `if (Game.Has('Dragon fang')) mult*=1.03; if (decay.challengeStatus('combo3')) { mult *= (1 + 27.27 / (Math.max(Game.log10Cookies - 9, 0) / 6 + 1)); }`));
		Game.clickMult = 1;
		eval('Game.mouseCps='+Game.mouseCps.toString().replace('var out=mult*Game.ComputeCps', 'Game.clickMult = mult; var out=mult*Game.ComputeCps'));
		
		addLoc('(note: there is no way to stack Click frenzy and Dragonflight in this mod)');
		addLoc('Sacrificing the garden leaves the %1 seed in addition to Baker\'s Wheat');
		addLoc('Unlocks the <b>Power channel</b> in your Utenglobe, converting souls into power at double the rates');
		new decay.challenge('combo4', loc('Get a <b>direct</b> click power multiplier of at least <b>x%1</b> in the first <b>%2</b> of the run.', [Beautify(50000), Game.sayTime(10 * 60 * Game.fps)]) + '<br>' + loc('(note: there is no way to stack Click frenzy and Dragonflight in this mod)'), function(c) { if (Game.TCount >= 600 * Game.fps) { c.makeCannotComplete(); } return (Game.clickMult >= 50000); }, loc('Sacrificing the garden leaves the %1 seed in addition to Baker\'s Wheat', 'Thumbcorn') + '<br>' + loc('Unlocks the <b>Power channel</b> in your Utenglobe, converting souls into power at double the rates'), decay.challengeUnlockModules.box, { prereq: 'combo3' });
		addLoc('Get a <b>direct</b> click power multiplier of at least <b>x%1</b> with only one buff active, without Santa\'s helpers, while not having a Dragonflight, and without help from the Garden. Then, click a naturally spawning golden cookie with Reaper of Fields slotted. (while the click power requirement is met)');
		addLoc('All dragon auras cost <b>50 less</b> buildings to unlock');
		addLoc('Your dragon starts out hatched with the first aura unlocked');
		new decay.challenge('comboDragonCursor', loc('Get a <b>direct</b> click power multiplier of at least <b>x%1</b> with only one buff active, without Santa\'s helpers, while not having a Dragonflight, and without help from the Garden. Then, click a naturally spawning golden cookie with Reaper of Fields slotted. (while the click power requirement is met)', [Beautify(1165)]), function(c) { if (Game.Has('Santa\'s helpers')) { c.makeCannotComplete(); } return false; }, loc('All dragon auras cost <b>50 less</b> buildings to unlock') + '<br>' + loc('Your dragon starts out hatched with the first aura unlocked'), decay.challengeUnlockModules.vial, { prereq: ['combo3', 2] });
		
		addLoc('Obtain a <b>direct</b> click power multiplier of at least <b>x%1</b> during a Frenzy in the first <b>%2</b> of the run, without casting more than one spell, and with the Golden switch turned on.');
		addLoc('The Golden switch is <b>%1%</b> cheaper');
		new decay.challenge('comboGSwitch', loc('Obtain a <b>direct</b> click power multiplier of at least <b>x%1</b> during a Frenzy in the first <b>%2</b> of the run, without casting more than one spell, and with the Golden switch turned on.', [Beautify(1000), Game.sayTime(3 * 60 * Game.fps + 10 * Game.fps, -1)]), function(c) { if (Game.TCount >= 190 * Game.fps) { c.makeCannotComplete(); } return (gp.spellsCast <= 1 && Game.clickMult >= 1000 && Game.Has('Golden switch [off]')); }, loc('The Golden switch is <b>%1%</b> cheaper', 25) + '<br>' + loc('Wrinklers approach the big cookie <b>10%</b> slower'), function() { return (decay.challengeUnlockModules.box() && Game.Has('Golden switch')); }, { deprecated: true, category: 'box', prereq: ['combo2', 'earthShatterer'] });
		Game.Upgrades['Golden switch [off]'].priceFunc = function() {return Game.cookiesPs*60*60*(decay.challengeStatus('comboGSwitch')?0.75:1);}
		Game.Upgrades['Golden switch [on]'].priceFunc = function() {return Game.cookiesPs*60*60*(decay.challengeStatus('comboGSwitch')?0.75:1);}
		
		addLoc('Each dragon aura only takes <b>%1</b> buildings each to unlock.');
		addLoc('Golden cookies have a high chance to grant Mini-frenzies, a distinct buff from regular Frenzies.');
		addLoc('Click frenzies from Force the Hand of Fate are much more common.');
		addLoc('Get at least <b>%1</b> Golden cookie effects active at the same time in the first <b>%2</b> of the run.');
		addLoc('Chance to spawn a Golden cookie when selling with Dragon Orbs <b>%1%</b> --> <b>%2%</b>');
		addLoc('Evolving your dragon no longer consume buildings');
		addLoc('three');
		new decay.challenge('comboOrbs', loc('Each dragon aura only takes <b>%1</b> buildings each to unlock.', 2) + '<br>' + loc('Golden cookies have a high chance to grant Mini-frenzies, a distinct buff from regular Frenzies.') + '<br>' + loc('Click frenzies from Force the Hand of Fate are much more common.') + '<br>' + loc('Get at least <b>%1</b> Golden cookie effects active at the same time in the first <b>%2</b> of the run.', [loc('three'), Game.sayTime(10 * 60 * Game.fps)]), function(c) { if (Game.TCount >= 10 * 60 * Game.fps) { decay.forceAscend(); } return (Game.gcBuffCount() >= 3)}, loc('Chance to spawn a Golden cookie when selling with Dragon Orbs <b>%1%</b> --> <b>%2%</b>', [10, 25]) + '<br>' + loc('Evolving your dragon no longer consume buildings'), decay.challengeUnlockModules.box, { conditional: true, prereq: ['powerClickWrinklers'] });
		new Game.buffType('mini frenzy', function(time, pow) {
			return {
				name: 'Mini frenzy',
				desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
				icon: [10, 14],
				time: time * Game.fps,
				add: true,
				multCpS: pow,
				aura: 1
			}
		});
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`if (Math.random()<0.05 && Game.season=='fools') list.push('everything must go');`, `if (Math.random()<0.05 && Game.season=='fools') list.push('everything must go'); if (decay.isConditional('comboOrbs') && !me.wrath) { list.push('miniFrenzy'); }`).replace(`else if (choice=='multiply cookies')`, `else if (choice=='miniFrenzy') { buff=Game.gainBuff('mini frenzy', Math.ceil(77 * effectDurMod), 1.7); } else if (choice=='multiply cookies')`));
		
		addLoc('You keep <span class="highlightHover underlined" %1>Trigger fingers</span> and <span class="highlightHover underlined" %2>Non-euclidean baking trays</span> across ascensions');
		addLoc('Speed baking IV');
		new decay.challenge('sb4', loc("Get to <b>%1</b> baked in <b>%2</b>.", [loc("%1 cookie", LBeautify(1e8)), Game.sayTime(3 * Game.fps)]), function(c) { if (Game.TCount >= 3 * Game.fps) { c.makeCannotComplete(); } return ( Game.cookiesEarned > 1e8); }, loc('You keep <span class="highlightHover underlined" %1>Trigger fingers</span> and <span class="highlightHover underlined" %2>Non-euclidean baking trays</span> across ascensions', [decay.getUpgradeTooltipCSS('Trigger fingers'), decay.getUpgradeTooltipCSS('Non-euclidean baking trays')]) + '<br>' + loc('Speed baking IV'), decay.challengeUnlockModules.box, { prereq: 'comboOrbs', onCompletion: function() { Game.Win('Speed baking IV'); } });

		addLoc('Get a CpS multiplier from buffs of at least <b>x%1</b> and a direct click power multiplier of at least <b>x%2</b> simultaneously, in the first <b>%3</b> of the run');
		new decay.challenge('godzSwap', loc('Get a CpS multiplier from buffs of at least <b>x%1</b> and a direct click power multiplier of at least <b>x%2</b> simultaneously, in the first <b>%3</b> of the run', [100, 5000, Game.sayTime(6 * 60 * Game.fps)]), function(c) { if (Game.TCount >= 360 * Game.fps) { c.makeCannotComplete(); } return (Game.buffCpsMult >= 100 && Game.clickMult >= 5000); }, loc(''), function() { return false; }, { deprecated: true, prereq: 'godz' });
		Game.buffsCpsMult = 1;
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('Game.globalCpsMult*=mult;', 'Game.buffsCpsMult = (mult * Game.cookiesPs) / Game.unbuffedCps; Game.globalCpsMult*=mult;'));
		
		addLoc('%1 and %2');
		addLoc('Get <b>%1</b> distinct Golden cookie effects active at once');
		addLoc('Script writer code to purify decay by an especially large amount');
		new decay.challenge('combo5', loc('Get <b>%1</b> distinct Golden cookie effects active at once', 3), function() { return (Game.gcBuffCount() >= 3); }, loc('Sacrificing the garden leaves the %1 seed in addition to Baker\'s Wheat', loc('%1 and %2', ['Ordinary clover', 'Nursetulip'])), decay.challengeUnlockModules.truck, { prereq: ['combo4', 'dualcast', 5] });

		addLoc('Unlocks a Elder Covenant mode to allow the strength stacking of Frenzy.');
		addLoc('Get any golden cookie buff to be at least <b>%1</b> long.');
		new decay.challenge('buffStack', loc('Get any golden cookie buff to be at least <b>%1</b> long.', Game.sayTime(10 * 60 * Game.fps)), function() { for (let i in Game.buffs) { if (decay.gcBuffs.includes(Game.buffs[i].type.name) && Game.buffs[i].time > 600 * Game.fps) { return true; } } return false; }, loc('Unlocks a Elder Covenant mode to allow the strength stacking of Frenzy.'), decay.challengeUnlockModules.truck, { deprecated: true, prereq: ['combo4', 'dualcast'] });

		addLoc('Get <b>%1</b> of any buffs active simultaneously.');
		addLoc('Dragon Orbs can ignore up to <b>1</b> buff when attempting to spawn a Golden cookie.');
		new decay.challenge('allBuffStack', loc('Get <b>%1</b> of any buffs active simultaneously.', Beautify(12)), function() { return (Object.keys(Game.buffs).length >= 12); }, loc('Dragon Orbs can ignore up to <b>1</b> buff when attempting to spawn a Golden cookie.'), decay.challengeUnlockModules.never, { deprecated: true, prereq: ['buffStack', 'combo5'] });

		addLoc('Click frenzy from Force the Hand of Fate chance <b>+%1%</b>');
		new decay.challenge('allBuffStackR', function(c) { return loc('Get <b>%1</b> of any buffs active simultaneously.', Beautify(15 + c * 3))+(c?'<br>'+loc('Completions: ')+'<b>'+Beautify(c)+'</b>':''); }, function(c) { return (Object.keys(Game.buffs).length >= (15 + c.complete * 3)); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.05') + '<br>' + loc('Click frenzy from Force the Hand of Fate chance <b>+%1%</b>', 2), decay.challengeUnlockModules.truck, { order: 1002, repeatable: true, prereq: 'dualcast' });

		addLoc('Get a Click Frenzy of at least <b>%1</b> long.');
		addLoc('Chance of Click Frenzy from Force the Hand of Fate is massively increased and magic regeneration is faster. Gambler\'s Fever dream cannot be used. You cannot refill minigames with sugar lumps.');
		addLoc('Valentine\'s cookies are between <b>2x</b> and <b>5x</b> stronger');
		addLoc('Get hint');
		addLoc('Each exhaustion lasts <b>15%</b> shorter')
		addLoc('While having no purity and is not coagulated, decay rates <b>-25%</b>.');
		addLoc('By selling wizard towers at the right moment, you can cast Force the Hand of Fate twice in a row.'); //dont actually give a solution because if you dont then people will come to the community to ask questions which boost the community, this is just me being nice, hypothetically I could pull a terraria and leave the player there
		new decay.challenge('dualcast', loc('Chance of Click Frenzy from Force the Hand of Fate is massively increased and magic regeneration is faster. Gambler\'s Fever dream cannot be used. You cannot refill minigames with sugar lumps.')+'<br>'+loc('Get another Click frenzy while a Click frenzy is ongoing.') + '<br><div class="framed" style="width: 50px; text-align: center;" '+Game.clickStr+'="Game.Notify(loc(\'Get hint\'), loc(\'By selling wizard towers at the right moment, you can cast Force the Hand of Fate twice in a row.\'), [22, 11])">' + loc('Get hint') + '</div>', function() { return (Game.hasBuff('Click frenzy') && Game.hasBuff('Click frenzy').time >= 30 * Game.fps); }, loc('Valentine\'s cookies are between <b>2x</b> and <b>5x</b> stronger') + '<br>' + loc('Each exhaustion lasts <b>15%</b> shorter') + '<br>' + loc('While having no purity and is not coagulated, decay rates <b>-25%</b>.'), decay.challengeUnlockModules.truck, { prereq: ['earthShatterer', 'powerClickWrinklers'], conditional: true, init: function() { decay.gameCan.refillMinigames = false; }, reset: function() { decay.gameCan.refillMinigames = true; } });
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777*(1+(Game.auraMult('Dragon Cursor')*0.5)));`, 'if (decay.isConditional("dualcast") && Game.hasBuff("Click frenzy")) { decay.challenges["dualcast"].finish(); }' + `buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777*(1+(Game.auraMult('Dragon Cursor')*0.5)));`))

		addLoc('You start with an acceleration of <b>x%1</b>.');
		addLoc('Stack a Frenzy, Dragon Harvest, and a Click frenzy, then gain at least <b>+200%</b> purity and at least <b>%1</b> cookies.');
		addLoc('Unlocks a Elder Covenant mode to allow the strength stacking of Dragon Harvest.');
		new decay.challenge('combo6', loc('You start with an acceleration of <b>x%1</b>.', 2)+'<br>'+loc('Stack a Frenzy, Dragon Harvest, and a Click frenzy, then gain at least <b>+400%</b> purity and at least <b>%1</b> cookies.', Beautify(1e27)), function() { return (Game.hasBuff('Frenzy') && Game.hasBuff('Dragon Harvest') && Game.hasBuff('Click frenzy') && decay.gen >= 5 && Game.cookiesEarned >= 1e27); }, loc('Unlocks a Elder Covenant mode to allow the strength stacking of Dragon Harvest.'), decay.challengeUnlockModules.never, { deprecated: true, prereq: ['dualcast', 'allBuffStack'], conditional: true });

		addLoc('Each research upgrade gives an additional <b>+%1%</b> CpS.');
		addLoc('With less than <b>%1x</b> acceleration, increase decay by <b>%2</b> times over the course of an Elder Pledge purification.');
		let researchCheckObj = {
			check: function(t) {
				if (decay.acceleration >= 1.54) { t.challengeObj.makeCannotComplete(); return; }
				if (Game.pledgeT > 0) { t.mostDecay = Math.max(decay.gen, t.mostDecay); } else { t.mostDecay = 0; }
				if (decay.gen / t.mostDecay <= 1/10000) { return true; }
			},
			save: function(t) { return t.mostDecay; },
			load: function(t, str) { if (isv(str)) { t.mostDecay = parseFloat(str); } },
			init: {
				mostDecay: 0
			}
		}
		new decay.challenge('research', loc('With less than <b>%1x</b> acceleration, increase decay by <b>%2</b> times over the course of an Elder Pledge purification.', [1.54, Beautify(10000)]), decay.quickCheck(researchCheckObj, researchCheckObj.init), loc('Each research upgrade gives an additional <b>+%1%</b> CpS.', Beautify(2)), decay.challengeUnlockModules.vial, { deprecated: true, prereq: 'wrinkler1' });
		addLoc('With <b>Challenge %1</b> completed: <b>+%2%</b> CpS');
		for (let i in Game.UpgradesByPool['tech']) {
			Game.UpgradesByPool['tech'][i].descFunc = function() {
				if (decay.challengeStatus('research')) { return '<div style="text-align:center;">'+loc('With <b>Challenge %1</b> completed: <b>+%2%</b> CpS', [decay.challenges.research.name, 2])+'</div><div class="line"></div>'+Game.UpgradesByPool['tech'][i].desc; }
				return Game.UpgradesByPool['tech'][i].desc;
			}
		}

		addLoc('The required halt increase from acceleration <b>starts immediately</b> instead of at x1.5.');
		addLoc('All halting methods are <b>5%</b> stronger');
		addLoc('The Earth Shatterer aura halts decay for <b>10%</b> longer.');
		addLoc('You get <b>+1% CpS</b> for each flavored cookie you have');
		new decay.challenge('earthShatterer', loc('The required halt increase from acceleration <b>starts immediately</b> instead of at x1.5.') + ' ' + loc('All halting methods are <b>5%</b> stronger.') + '<br>' + loc('Bake <b>%1</b> cookies.', Beautify(1e24)), function() { return (Game.cookiesEarned >= 1e24); }, loc('The Earth Shatterer aura halts decay for <b>10%</b> longer') + '<br>' + loc('You get <b>+1% CpS</b> for each flavored cookie you have'), decay.challengeUnlockModules.box, { conditional: true, prereq: ['combo3'], init: function() { decay.accToRequiredHaltMinimum = 1; if (Game.TCount <= 1) { decay.acceleration = 1.05; } }, order: 21.5, reset: function() { decay.accToRequiredHaltMinimum = 1.5; } });
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('for (var i in Game.cookieUpgrades)', 'var upgradeCount = 0; for (var i in Game.cookieUpgrades)').replace(`mult*=(1+(typeof(me.power)==='function'?me.power(me):me.power)*0.01);`, `mult*=(1+(typeof(me.power)==='function'?me.power(me):me.power)*0.01); upgradeCount++;`).replace(`if (Game.Has('Specialized chocolate chips')) mult*=1.01;`, `if (decay.challengeStatus('earthShatterer')) { mult *= 1 + upgradeCount * 0.01; } if (Game.Has('Specialized chocolate chips')) mult*=1.01;`));

		addLoc('The game becomes <b>very weird</b>.');
		new decay.challenge('anchorWack', loc('The game becomes <b>very weird</b>.') + '<br>' + loc('Bake <b>%1</b>.', loc('%1 cookie', LBeautify(1e44))), function() { return (Game.cookiesEarned > 1e44); }, loc('Nothing (optional challenge)'), decay.challengeUnlockModules.box, { conditional: true, prereq: ['earthShatterer', 'powerClickWrinklers', 3], reset: function() { 
			decay.anchorOffsetX = 0;
			decay.anchorOffsetY = 0;

			Crumbs.defaultAnchors.center.x = 0.5; 
			Crumbs.defaultAnchors.center.y = 0.5; 
			Crumbs.defaultAnchors.top.x = 0.5; 
			Crumbs.defaultAnchors.top.y = 0; 
			Crumbs.defaultAnchors['top-left'].x = 0; 
			Crumbs.defaultAnchors['top-left'].y = 0; 

			let listToApply = [decay.cookieWall, decay.gameBGObject, decay.milkObject];
			for (let i in listToApply) {
				listToApply[i].getComponent('patternFill').offX = 0;
				listToApply[i].getComponent('patternFill').offY = 0;
			}

			decay.milkObject.scaleY = 2;

			l('bigCookie').style.transform = '';
		}, order: optionalChallengeOrder });
		decay.anchorOffsetX = 0; 
		decay.anchorOffsetY = 0;
		Game.registerHook('logic', function() {
			if (!decay.isConditional('anchorWack')) { return; }

			let circles = [
				[-101, -101],
				[23, 23],
				[-17, 13],
				[11, -37],
				[-39, -7],
				[-5, 9],
				[2, -3]
			];
			decay.anchorOffsetX = 0;
			decay.anchorOffsetY = 0;
			for (let i = 0; i < circles.length; i++) {
				const progressConst = Math.min(Math.max(Game.log10CookiesSimulated - 4, 0) / 2 / Math.pow(1 + i, 1.5), 1);
				decay.anchorOffsetX += Math.sin(Game.T / circles[i][0] / (8 / progressConst)) * (0.2 + i * 0.2) / circles.length * progressConst;
				decay.anchorOffsetY += Math.cos(Game.T / circles[i][1] / (8 / progressConst)) * (0.2 + i * 0.2) / circles.length * progressConst;
			}

			Crumbs.defaultAnchors.center.x = 0.5 + decay.anchorOffsetX; 
			Crumbs.defaultAnchors.center.y = 0.5 + decay.anchorOffsetY; 
			Crumbs.defaultAnchors.top.x = 0.5 + decay.anchorOffsetX; 
			Crumbs.defaultAnchors.top.y = decay.anchorOffsetY; 
			Crumbs.defaultAnchors['top-left'].x = decay.anchorOffsetX; 
			Crumbs.defaultAnchors['top-left'].y = decay.anchorOffsetY; 

			let listToApply = [decay.cookieWall, decay.gameBGObject];
			for (let i in listToApply) {
				listToApply[i].getComponent('patternFill').offX = 0;
				if (listToApply[i] != decay.cookieWall) { listToApply[i].getComponent('patternFill').offY = 0; }
				listToApply[i].getComponent('patternFill').offX += Crumbs.getPWidth(listToApply[i]) * decay.anchorOffsetX;
				listToApply[i].getComponent('patternFill').offY += Crumbs.getPHeight(listToApply[i]) * decay.anchorOffsetY;
			}

			decay.milkObject.getComponent('patternFill').offX = Crumbs.getPWidth(decay.milkObject) * decay.anchorOffsetX;
			const pHeight = Crumbs.getPHeight(decay.milkObject) / decay.milkObject.scaleY * 2;
			decay.milkObject.y += pHeight * decay.anchorOffsetY;
			if (decay.milkObject.y - Crumbs.getOffsetY(decay.milkObject.anchor, pHeight) < decay.milkObject.scope.l.height - pHeight) { 
				decay.milkObject.scaleY = 2 + 2 * (decay.milkObject.scope.l.height - pHeight - (decay.milkObject.y - Crumbs.getOffsetY(decay.milkObject.anchor, pHeight))) / pHeight;
			} 

			l('bigCookie').style.transform = 'translate('+(decay.anchorOffsetX * -100)+'%, '+(decay.anchorOffsetY * -100)+'%)';
		});
		let tileableAnchor = new Crumbs.anchor(0, 0);
		Crumbs.findObject('cookieWall').setAnchor(tileableAnchor);
		Crumbs.findObject('gameBG').setAnchor(tileableAnchor);
		Crumbs.findObject('milk').setAnchor(tileableAnchor);
		Crumbs.findObject('shadedBorders', 'left').setAnchor(tileableAnchor);
		Crumbs.findObject('shadedBorders', 'background').setAnchor(tileableAnchor);
		Crumbs.findObject('shadedBordersStrong', 'left').setAnchor(tileableAnchor);
		decay.tileableAnchor = tileableAnchor;
		decay.cookieWall = Crumbs.findObject('cookieWall');
		decay.gameBGObject = Crumbs.findObject('gameBG');
		decay.milkObject = Crumbs.findObject('milk');
		Crumbs.findObject('cursors').width = 256;
		Crumbs.findObject('cursors').height = 256;
		Crumbs.findObject('cursors').addBehavior(function() {
			this.x += -decay.anchorOffsetX * this.width;
			this.y += -decay.anchorOffsetY * this.height;
		});

		addLoc('Augments are adjusted, but every available augment becomes <b>free</b>.<br>Refill cooldowns are half as long.<br>You start with only Baker\'s wheat and Meddleweed, and sacrifice the garden by getting every seed. (Your seeds outside of this challenge will be restored when you leave this challenge)');
		addLoc('CpS <b>+50%</b> permanently per sacrifice, for up to <b>+200%</b>');
		addLoc('Corresponding boost in the glucose furnace if you have not sacrificed the garden before');
		decay.speedsacChallengePrevStore = '';
		decay.initSpeedsacChallenge = function() {
			decay.gardenAugments.mutsMult.cost = 0;
			decay.gardenAugments.growthMinus.cost = 0;
			decay.gardenAugments.growth.cost = 0;
			decay.gardenAugments.growthModerate.cost = 0;
			decay.gardenAugments.growthPlus.cost = 0;
			decay.gardenAugments.forcedMuts.enabled = false;
			decay.gardenAugments.growthMinus.enabled = true;
			decay.gardenAugments.growthModerate.enabled = true;
		}
		new decay.challenge('speedsac', loc('Augments are adjusted, but every available augment becomes <b>free</b>.<br>Refill cooldowns are three times as short.<br>You start with only Baker\'s wheat and Meddleweed, and sacrifice the garden by getting every seed. (Your seeds outside of this challenge will be restored when you leave this challenge)'), function() { return false; }, loc('CpS <b>+50%</b> permanently per sacrifice, for up to <b>+200%</b>')+'<br>'+loc('Corresponding boost in the glucose furnace if you have not sacrificed the garden before'), decay.challengeUnlockModules.truck, { conditional: true, prereq: ['dualcast'],
		reincarnate: function() {
			const M = gap;
			let str = '';
			for (let i in M.plants) {
				str+=''+(M.plants[i].unlocked?'1':'0');
				M.plants[i].unlocked = 0;
			}
			M.plants['bakerWheat'].unlocked = 1;
			M.plants['meddleweed'].unlocked = 1;
			decay.speedsacChallengePrevStore = str;

			M.buildPlot();
			M.buildPanel();
		},
		init: function() {
			if (gardenUpdated) {
				decay.initSpeedsacChallenge();
			} else {
				const interval = setInterval(function() { if (gardenUpdated) { decay.initSpeedsacChallenge(); clearInterval(interval); } }, 10);
			}
		}, 
		reset: function() {
			decay.gardenAugments.mutsMult.cost = 1;
			decay.gardenAugments.growthMinus.cost = 1;
			decay.gardenAugments.growth.cost = 1;
			decay.gardenAugments.growthModerate.cost = 2;
			decay.gardenAugments.growthPlus.cost = 2;
			decay.gardenAugments.forcedMuts.enabled = true;
			decay.gardenAugments.growthMinus.enabled = false;
			decay.gardenAugments.growthModerate.enabled = false;

			if (!decay.speedsacChallengePrevStore) { return; }

			const seeds = decay.speedsacChallengePrevStore.split('');
			const M = gap;
			for (let i in M.plants) {
				if (seeds[M.plants[i].id] == '1') { M.plants[i].unlocked = 1; } 
				else { M.plants[i].unlocked = 0; }
			}

			decay.speedsacChallengePrevStore = '';

			M.buildPlot();
			M.buildPanel();
		} });

		//acceleration
		decay.startingAcc = 1.1;
		decay.accInc = 0; //general increase per second (divided by Game.fps) without accounting for decay; set with function
		decay.accSmoothBuffer = 0.3; //smaller it is, the slower accelerCCation picks up
		decay.accSmoothFactor = 1.2; //bigger it is, the slower acceleration picks up
		decay.accSmoothMultFactor = 5; //bigger it is, the faster acceleration picks up
		decay.accIncPowOnPurity = 2.2; //unused; more it is, the more acceleration gets slowed down with increasing purity
		decay.accIncLogOnDecay = 1698; //unused; more it is, the slower acceleration increases with increasing decay
		decay.accBuffAsymptoteOnDecay = 4; //unused; asymptomatic multiplier to acceleration with decay
		decay.accBuffAsymptotePow = 0.025; //unused; closer this is to 0 (always positive), the slower the asymptomatic multiplier picks up
		decay.accBuffAsymptoteThreshold = 0; //unused; when decay is below this point, stop calculating the asymptomatic multiplier and assume the full multiplier, switching to the log method for increasing the speed
		decay.updateAcc = function() {
			const amount = decay.accInc * Math.min(Math.pow((1 - 1 / (decay.acceleration * decay.accSmoothMultFactor + decay.accSmoothBuffer)), decay.accSmoothFactor), ((decay.acceleration > decay.accToRequiredHaltMinimum)?0.5:1)) * decay.getAccTickspeed();
			if (decay.gen >= 1) {
				return amount * Math.pow(1 / decay.gen, decay.accIncPowOnPurity);
			} else {
				return amount * Math.max(decay.broken, decay.shatterManifestation);
				//speedup scrapped, too wonky
				if (decay.gen > decay.accBuffAsymptoteThreshold) {
					return amount * decay.accBuffAsymptoteOnDecay * ((1 - Math.pow(2, -decay.accBuffAsymptotePow * (1 / decay.gen))) + 1);
				} else {
					return amount * (decay.accBuffAsymptoteOnDecay + 1) * Math.log(1 / decay.gen + decay.accIncLogOnDecay - 1) / Math.log(decay.accIncLogOnDecay);
				}
			} 
		}
		decay.getAccTickspeed = function() {
			var tickSpeed = 1;
			//if (decay.challengeStatus('veil') && Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { tickSpeed *= 0.4; }
			return tickSpeed;
		}
		decay.recalcAccStats = function() {
			decay.accInc = 0.00135 / Game.fps;
			decay.accBuffAsymptoteThreshold = decay.accBuffAsymptotePow / 6;
			decay.startingAcc = 1.1;

			if (decay.isConditional('combo6')) { decay.startingAcc = 2; }
		}
		Game.registerHook('check', decay.recalcAccStats);

		//decay.checkChallengeUnlocks();

		allValues('challenges');

		/*=====================================================================================
        Custom upgrades & achievements
        =======================================================================================*/

		this.createHeavenlyUpgrade = function(name, desc, cost, icon, parents, posX, posY, order) {
			let upgrade = new Game.Upgrade(name, desc, cost, icon);
			this.achievements.push(upgrade);
			upgrade.pool = 'prestige';
			upgrade.posX = posX ?? 0;
			upgrade.posY = posY ?? 0;
			parents = parents ?? [];
			parents = [].concat(parents);
			if (order) { upgrade.order = order; }
			for (let i = 0; i < parents.length; i++) {
				if (typeof parents[i] == 'string') { parents.splice(i, 1, Game.Upgrades[parents[i]]); }
			}
			upgrade.parents = parents;
			Game.PrestigeUpgrades.push(upgrade); Game.UpgradesByPool.prestige.push(upgrade);
			return upgrade;
		}

		this.createAchievements = function() {//Adding the custom upgrades
			this.achievements = [];
			this.achievements.push(new Game.Upgrade('Golden sugar',('Obtaining a dropped sugar lump gives <b>100 seconds</b> of Frenzy.') +'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]));

			this.createHeavenlyUpgrade('Cursedor',("Unlocks <b>cursedor</b>, which concentrates and converts your cookies clicked amount this ascension into a golden cookie; the more you clicked, the better effects the golden cookie will yield.")+'<q>Like Russian roulette, but for cookies.</q>',11111111111111111,[0,1,kaizoCookies.images.custImg], ['Luminous gloves'], -150, -760);
			
		    this.achievements.push(new Game.Upgrade('Cursedor [inactive]',("Activating this will spawn a golden cookie based on the amount of times you clicked the big cookie this ascension when you click the big cookie. Upon use, your cookies clicked stat will be reset and the golden cookie spawned yields effects based on the amount it consumed."),0,[0,1,kaizoCookies.images.custImg]));
			Game.last.pool='toggle';Game.last.toggleInto='Cursedor [active]';

			this.achievements.push(new Game.Upgrade('Cursedor [active]',("The Cursor is currently active, and clicking the big cookie will reset your big cookies clicked amount and spawn a golden cookie. <br>Turning it off will revert those effects.</b>"),0,[0,1,kaizoCookies.images.custImg]));
		    Game.last.pool='toggle';Game.last.toggleInto='Cursedor [inactive]';Game.last.timerDisplay=function(){if (!Game.Upgrades['Cursedor [inactive]'].bought) return -1; else return 1-Game.fps*60*60*60*60*60*60;};
			decay.toggleUpgradesMap.push({name: 'cursedor', upgradeOn: Game.Upgrades['Cursedor [inactive]'], upgradeOff: Game.Upgrades['Cursedor [active]']});

			this.achievements.push(Game.NewUpgradeCookie({name:'The ultimate cookie',desc:'These were made with the purest and highest quality ingredients, legend says: "whom has the cookie they shall become the most powerful baker." No, this isn\'t just a normal cookie.',icon:[10,0],power:		100,	price:	999999999999999999999999999999999999999999999999999999999999999999999999999}));
			Game.cookieUpgrades.push(Game.last);
			decay.unskippableUpgrades.push(Game.last);
			this.achievements.push(new Game.Upgrade('Purity vaccines', '<b>Stops all decay.</b><q>Developed for the time of need.</q>', 7, [20, 6])); Game.last.pool='debug'; Game.UpgradesByPool['debug'].push(Game.last);

			this.createHeavenlyUpgrade('Unshackled Purity',("Purification is <b>no longer limited by caps</b>; however, increasing purity past the cap will require an increased amount of purification power. <br>The decay rate increase from purity increase <b>-25%</b>.")+'<q>One of the strongest antidotes that has been found; it can cure all known diseases.</q>',250000000000000,[4,1,kaizoCookies.images.custImg], [], 750, 200);

			this.createHeavenlyUpgrade('Unshackled Elder Pledge',("Makes Elder Pledge's purification <b>25%</b> stronger, reduces the cooldown by <b>25%</b>, and makes the active duration <b>25%</b> longer.")+'<q>Your pledge to the grandmas is stronger than ever before.</q>',2560000000000000,[1,1,kaizoCookies.images.custImg],['Unshackled grandmas'], 515, -360);
			
			this.createHeavenlyUpgrade('Uranium rolling pins', ('The Elder Pledge halts decay for <b>3</b> times longer on use.')+('<q>Radiation, my superpower!</q>'), 90000000000000, [5, 1, kaizoCookies.images.custImg],['Cat ladies'],800,-740);

			this.createHeavenlyUpgrade('Sparkling wonder', ('The <b>Shimmering Veil</b> has a <b>10%</b> chance to be revived to full health on collapse.')+('<q>Just within reach, yet at what cost?</q>'), 1500000000000000, [23, 34], 'Glittering edge', -622, 662);
			
			this.createHeavenlyUpgrade('Withering prices', 'Your upgrades are <b>0.1%</b> cheaper for every <b>x0.5</b> CpS multiplier from your decay.<q>Oh my, oh my!</q>', 666, [3, 3, kaizoCookies.images.custImg], ['Starter kit'], -390, -300);

			this.achievements.push(new Game.Upgrade('Caramelized luxury', 'You gain <b>+5% CpS</b> for each sugar lump that you have ever obtained, for up to a total of <b>+80%</b> CpS.<q>The caramelization process causes the sugar molecules to change states, giving it a strong, deep aroma.</q>', 1000000000000000, [28, 27]));
			this.achievements.push(new Game.Upgrade('Meaty disgust', 'Claiming sugar lumps <b>halt decay</b>, with triple the duration for meaty sugar lumps.<q>The presence of decay causes the sugar molecules growing within to fold in on itself, creating an entangled conglomeration that breeds agony.</q>', 1000000000000000000000000000, [28, 17]));
			this.achievements.push(new Game.Upgrade('High-fructose sugar lumps', 'The effect cap of Caramelized luxury is increased to <b>+300%</b>.<q>Despite how obviously unhealthy, it is undoubtly, very delicious.</q>', 1000000000000000000000000000000000000000000000, [28, 14]));
			this.achievements.push(new Game.Upgrade('Rainy day lumps', 'You gain <b>+1% prestige effect</b> for each level of all buildings, for up to a total of <b>+200%</b> effect.<q>Just in case of hunger.</q>', 1000000000000000000000000000000000000000000000000000000000000000, [29, 15]));

			eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace('price*=0.95', '{ price*=0.95; } if (Game.Has("Withering prices") && !Game.OnAscend) { price *= Math.pow(0.999, Math.log2(Math.max(1 / decay.gen, 1))); } if (Game.Has("Wrinkler ambergris")) { price *=0.99; }'));
			
			Game.Upgrades['Golden sugar'].order = 350045;
			Game.Upgrades['Cursedor'].order = 253.004200000;
			Game.Upgrades['Cursedor [inactive]'].order = 30000;
			Game.Upgrades['Cursedor [active]'].order = 30000;
			Game.Upgrades['The ultimate cookie'].order = 9999999999;
			Game.Upgrades['Purity vaccines'].order = 1;
			Game.Upgrades['Unshackled Purity'].order = 770;
			Game.Upgrades['Unshackled Elder Pledge'].order = 771;
			Game.Upgrades['Uranium rolling pins'].order = 275;
			Game.Upgrades['Sparkling wonder'].order = 283;
			Game.Upgrades['Withering prices'].order = 287;
			Game.Upgrades['Caramelized luxury'].order = 350045;
			Game.Upgrades['Meaty disgust'].order = 350045;
			Game.Upgrades['High-fructose sugar lumps'].order = 350045;
			Game.Upgrades['Rainy day lumps'].order = 350045;
			

			this.createHeavenlyUpgrade('Purification domes', 'Lets you unlock a set of <b>new tiered</b> upgrades at 600 of each building, which make individual buildings accumulate decay slower. <br>All other decay-related calculations uses the combined impact of all buildings. <q>Within it is the incredible power of the belief in our ability to change.</q>', 5e14, [22, 3, kaizoCookies.images.custImg], 'Unshackled Purity', 615, 195);

			Game.Tiers['purity'] = {name:'Marbledpuree', unlock: -1, iconRow: 0, color: '#9ae726', special: 1, req: 'Purification domes', price: 8.888888888888888888888e+41, upgrades: []};
			eval('Game.TieredUpgrade='+Game.TieredUpgrade.toString().replace(`tier!='fortune'`, `tier!='fortune' && tier!='purity'`).replace(`else desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[building].plural))+desc;`, `else if (tier!='purity') { desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[building].plural))+desc; }`));
			this.upgrades = [];
			this.upgrades.push(Game.TieredUpgrade('Weekly finger-cutting', 'Cursors accumulate <b>20%</b> less decay.<q>Each cursor can possess a very great number of fingers, which past a point, doesn\'t really help them as they start to become intertwined and locked. Cutting some down from time to time helps a lot!</q>', 'Cursor', 'purity')); Game.last.icon = [0, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Concentrated workplace', 'Grandmas accumulate <b>40%</b> less decay.<q>Extensive studies have found that placing Grandmas in close proximity seems to help them. We\'re not sure why and honestly kind of scared, but I guess that\'s the way it is.</q>', 'Grandma', 'purity')); Game.last.icon = [1, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Everything repellant', 'Farms accumulate <b>60%</b> less decay.<q>When mother nature just can\'t escape the force of death, why not add in a batch of industrial poison?</q>', 'Farm', 'purity')); Game.last.icon = [2, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Improved resting condition', 'Mines accumulate <b>58%</b> less decay.<q>Everyone asks how is the working condition, but never how is the resting condition...</q>', 'Mine', 'purity')); Game.last.icon = [3, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Unified production lines', 'Factories accumulate <b>56%</b> less decay.<q>Why have so many small and neverending production lines, constantly clogging up space and losing products to the void between them - when you can just have... one?</q>', 'Factory', 'purity')); Game.last.icon = [4, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Sensible policies', 'Banks accumulate <b>54%</b> less decay.<q>You have realized the power of reducing suffering. Time to get to work!</q>', 'Bank', 'purity')); Game.last.icon = [15, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Morals', 'Temples accumulate <b>52%</b> less decay.<q>Thou must eat cookies.</q>', 'Temple', 'purity')); Game.last.icon = [16, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Reduced babbling', 'Wizard towers accumulate <b>50%</b> less decay.<q>In this house, we follow the laws of thermodynamics.</q>', 'Wizard tower', 'purity')); Game.last.icon = [17, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('No more engines', 'Shipments accumulate <b>48%</b> less decay.<q>No more pollution!</q>', 'Shipment', 'purity')); Game.last.icon = [5, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Lab-free alchemy', 'Alchemy labs accumulate <b>46%</b> less decay.<q>How to alchemy without lab:<br>1. Have ingredients at your ready;<br>2. Have the right tools;<br>3. Alchemy!<br>4. Don\'t get caught.</q>', 'Alchemy lab', 'purity')); Game.last.icon = [6, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Anti-anti-gravity-anti-matter', 'Portals accumulate <b>44%</b> less decay.<q>To close the portals of course. How else would you close them?</q>', 'Portal', 'purity')); Game.last.icon = [7, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('The present', 'Time machines accumulate <b>42%</b> less decay.<q>Now we wait.</q>', 'Time machine', 'purity')); Game.last.icon = [8, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Matter conversion', 'Antimatter condensers accumulate <b>40%</b> less decay.<q>Aha, the ultimate solution! Just convert matter back into antimatter!</q>', 'Antimatter condenser', 'purity')); Game.last.icon = [13, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('-1st electron layer', 'Prisms accumulate <b>38%</b> less decay.<q>Just make sure to not do this too much so you don\'t get any neutron stars.</q>', 'Prism', 'purity')); Game.last.icon = [14, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Quantum tunneling', 'Chancemakers accumulate <b>36%</b> less decay.<q>Helps a lot with clearing away the cookies around your Chancemakers.</q>', 'Chancemaker', 'purity')); Game.last.icon = [19, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('0.00000000001', 'Fractal engines accumulate <b>34%</b> less decay.<q>In a technique known as "Fractalization acceleration", it make copies of itself with a size scaling as close to 0 as possible. It seems to help, somewhat.</q>', 'Fractal engine', 'purity')); Game.last.icon = [20, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Restarts', 'Javascript consoles accumulate <b>32%</b> less decay.<q>As they always say: One restart a day, keeps all the bugs away.</q>', 'Javascript console', 'purity')); Game.last.icon = [21, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Going bowling', 'Idleverses accumulate <b>30%</b> less decay.<q>That\'s a hit!</q>', 'Idleverse', 'purity')); Game.last.icon = [22, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('A nice walk outside', 'Cortex bakers accumulate <b>28%</b> less decay.<q>If you experience any difficulty walking, please contact a manager.</q>', 'Cortex baker', 'purity')); Game.last.icon = [23, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Me', 'You accumulate <b>26%</b> less decay.<q>You, alone, are the reason behind all those decay. I figure that if there were less of you... maybe you can have even less.</q>', 'You', 'purity')); Game.last.icon = [24, 4, kaizoCookies.images.custImg];
			for (let i in this.upgrades) {
				this.upgrades[i].order = 19200 + i / 100;
				Game.Tiers['purity'].upgrades.push(this.upgrades[i]);
			}
			Game.registerHook('check', function() { const has = Game.Has('Purification domes'); for (let i in Game.Objects) { if (has && Game.Objects[i].amount >= 600) { Game.Unlock(Game.Objects[i].tieredUpgrades.purity.name); } } });

			this.achievements.push(Game.NewUpgradeCookie({name: 'Decayed cookie', desc: 'Looks bad, but still edible - just barely.', power: 1, price: 6789, icon: [4, 2, kaizoCookies.images.custImg]}));
   			Game.last.order = 999;
			Game.cookieUpgrades.push(Game.last);

			this.achievements = this.achievements.concat(this.upgrades);

			this.createHeavenlyUpgrade('Ultra-concentrated sweetener', 'Each building accumulates <b>2%</b> less decay for every level it has, for up to level 20.<q>\>99.99999% pure sweetness. Warning: ingestation may lead to lead poisoning.</q>', 1e15, [9, 4, kaizoCookies.images.custImg], ['Purification domes'], 513, 242);

			this.createHeavenlyUpgrade('Lumpy evolution', 'Decay propagation <b>-1%</b> for each building leveled to level 10 or above.<q>In this universe, the weak survives while the strong dies.</q>', 2e15, [23, 3, kaizoCookies.images.custImg], ['Ultra-concentrated sweetener'], 492, 355);

			this.achievements.push(new Game.Upgrade('Wrinkler ambergris', getStrCookieProductionMultiplierPlus(6)+'<br>'+"All upgrades are <b>1% cheaper</b>."+'<br>'+"Cost scales with CpS."+'<q>Occasionally regurgitated by wrinklers that died while digesting cookies.<br>The byproduct of some obscure metabolic process or other, it is as rare and precious as it is pungent.<br>Makes for a great toast spread.</q>',60,[7,2,kaizoCookies.images.custImg]));
			Game.last.priceFunc=function(){return Math.max(1000000,Game.cookiesPs*60*60);};
			Game.last.order = 25050.875;
			
			decay.purityTierStrengthMap = [0.2, 0.4, 0.6, 0.58, 0.56, 0.54, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28, 0.26, 0.24, 0.22, 0.2];

			this.achievements.push(new Game.Upgrade('Kitten janitors', 'You gain <b>more milk</b> the more purity you have.<q>This job sucks meow</q>', 900e+63, [18, 4, kaizoCookies.images.custImg])); Game.last.tier = 'purity'; Game.last.order = 20010;
			eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`milkMult*=Game.eff('milk');`, `milkMult*=Game.eff('milk'); if (Game.Has('Kitten janitors')) { milkMult*=1 + Math.log2(Math.max(decay.gen, 1)) * 0.0123; }`))

			this.createHeavenlyUpgrade('Script writer', 'Typing certain things may reveal some useful <b>hidden information</b>. (case insensitive).<q>Balance? I barely know her.<br><br>Where to start? The leading spriter of this mod might have the answer...</q>', 1e6, [8, 2, kaizoCookies.images.custImg], ['Golden cookie alert sound', 'Fanciful dairy selection', 'Distinguished wallpaper assortment'], 211, 572, 999); 
			Game.Upgrades['Sound test'].parents = [Game.last];
			Game.Upgrades['Distinguished wallpaper assortment'].basePrice = 1e5;
			Game.Upgrades['Fanciful dairy selection'].basePrice = 1e5;
			Game.Upgrades['Distinguished wallpaper assortment'].basePrice = 1e5;
			Game.Upgrades['Golden cookie alert sound'].basePrice = 299999;

			this.createHeavenlyUpgrade('Bakery', 'Unlocks the <b>cookie selector</b>, letting you pick how the big cookie looks.<br>Comes with a variety of cookies.<q>Weird, why would anyone build a bakery up here?</q>', 1000, [9, 1, kaizoCookies.images.custImg], ['Legacy'], -200, 180);

			this.achievements.push(new Game.Upgrade('Cookie selector', 'Lets you pick which cookie to display.',0,[26,17]));
			Game.last.descFunc=function(){
				var choice=this.choicesFunction()[Game.cookieType];
				if (choice==0) choice=this.choicesFunction()[0];
				return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(choice.icon)+' <b>'+choice.name+'</b></div><div class="line"></div>'+this.ddesc;
			};
			Game.last.order = 60000;
			decay.toggleUpgradesMap.push({name: 'cookie selector', choice: true, upgrade: Game.Upgrades['Cookie selector']});

			Game.cookieType = 0;

			Crumbs.findObject('bigCookie').findChild('bigCookieDisplay').addBehavior(new Crumbs.behaviorInstance(function() { this.imgs[0] = Game.cookiesByChoice[Game.cookieType].pic; this.scaleX *= (Game.cookiesByChoice[Game.cookieType].scaleX || 1); this.scaleY *= (Game.cookiesByChoice[Game.cookieType].scaleY || 1); }));
			const childList = Crumbs.findObject('bigCookie').findChild('bigCookieDisplay').children;
			for (let i in childList) {
				if (childList[i].imgs.length && childList[i].imgs[0] == 'cookieShadow.png') {
					childList[i].addBehavior(new Crumbs.behaviorInstance(function() { this.scaleX = 4 / this.scaleFactorX; this.scaleY = 4 / this.scaleFactorY; }));
				}
			}

			Game.last.pool='toggle';
			Game.last.choicesFunction=function()
			{
				var choices=[];
				for (let i in Game.cookiesByChoice)
				{
					choices[i]={name:Game.cookiesByChoice[i].name,icon:Game.cookiesByChoice[i].icon,order:Game.cookiesByChoice[i].order||parseInt(i)};
				}
				
				choices[1].div=true;
				
				for (let i in choices)
				{
					var it=choices[i];
				}
				
				choices[Game.cookieType].selected=1;
				return choices;
			}
			Game.last.choicesPick=function(id)
			{Game.cookieType=id;}
			
			Game.AllCookies=[
				{pic:'perfectCookie.png',name:'Automatic',icon:[0,7]},
				{pic:'perfectCookie.png',name:'Perfect cookie',icon:[28,10]},
				{pic:kaizoCookies.images.bigGolden,name:'Golden cookie',icon:[10,14]},
				{pic:kaizoCookies.images.bigWrath,name:'Wrath cookie',icon:[15,5]},
				{pic:kaizoCookies.images.classic,name:'Classic cookie',icon:[18,1,kaizoCookies.images.custImg]},
				{pic:'imperfectCookie.png',name:'Imperfect cookie',icon:[19,1,kaizoCookies.images.custImg]},
				{pic:kaizoCookies.images.yeetDragon,name:'Yeetdragon cookie',icon:[17,0,kaizoCookies.images.custImg],scaleX:0.6,scaleY:0.6},
				{pic:kaizoCookies.images.minecraft,name:'Minecraft cookie',icon:[16,1,kaizoCookies.images.custImg]},
				{pic:kaizoCookies.images.terraria,name:'Terraria cookie',icon:[17,1,kaizoCookies.images.custImg],scaleX:2,scaleY:2},
				{pic:kaizoCookies.images.eightBitCookie,name:'8-bit cookie',icon:[25,15,kaizoCookies.images.custImg]}
			];
			Game.cookiesByChoice={};
			for (let i in Game.AllCookies)
			{
				Game.cookiesByChoice[i]=Game.AllCookies[i];
			}
			if (!EN)
			{
				Game.cookiesByChoice[0].name=loc(Game.cookiesByChoice[0].name);
				for (var i=1;i<Game.cookiesByChoice.length;i++)
				{
					Game.cookiesByChoice[i].name='"'+Game.cookiesByChoice[i].pic+'"';
				}
			}

			this.createHeavenlyUpgrade('Enchanted Permanent upgrade slot I',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.",	1,[0,0,kaizoCookies.images.custImg], ['Starter kit'], -522, -384);
			Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(0);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(0);};
			Game.last.showIf=function(){return (decay.challengeStatus(1));};
			this.createHeavenlyUpgrade('Enchanted Permanent upgrade slot II',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.",	200,[1,0,kaizoCookies.images.custImg], ['Enchanted Permanent upgrade slot I'], -655, -490);
			Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(1);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(1);};
			Game.last.showIf=function(){return (decay.challengeStatus(2));};
			this.createHeavenlyUpgrade('Enchanted Permanent upgrade slot III',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.",	30000,[2,0,kaizoCookies.images.custImg], ['Enchanted Permanent upgrade slot II'], -765, -610);
			Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(2);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(2);};
			Game.last.showIf=function(){return (decay.challengeStatus(3));};
			this.createHeavenlyUpgrade('Enchanted Permanent upgrade slot IV',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.<br>Can only slot flavored cookie upgrades.",	4000000,[3,0,kaizoCookies.images.custImg], ['Enchanted Permanent upgrade slot III'], -785, -771);
			Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(3);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(3);};
			Game.last.showIf=function(){return (decay.challengeStatus(4));};
			this.createHeavenlyUpgrade('Enchanted Permanent upgrade slot V',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.<br>Can only slot flavored cookie upgrades.",	500000000,[4,0,kaizoCookies.images.custImg], ['Enchanted Permanent upgrade slot IV'], -743, -925);
			Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(4);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(4);};
			Game.last.showIf=function(){return (decay.challengeStatus(5));};
			
			var enchantedSlots=['Enchanted Permanent upgrade slot I','Enchanted Permanent upgrade slot II','Enchanted Permanent upgrade slot III','Enchanted Permanent upgrade slot IV','Enchanted Permanent upgrade slot V'];
			Game.EnchantedPermanentUpgrades=[-1,-1,-1,-1,-1];

			for (var i=0;i<enchantedSlots.length;i++) {
				Game.Upgrades[enchantedSlots[i]].descFunc=function(i){return function(context){
					if (Game.EnchantedPermanentUpgrades[i]==-1) return this.desc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
					var upgrade=Game.UpgradesById[Game.EnchantedPermanentUpgrades[i]];
					return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(upgrade.icon)+' <b>'+upgrade.dname+'</b><div class="line"></div></div>'+this.ddesc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
				};}(i);
				Game.Upgrades[enchantedSlots[i]].order = 270 + Game.Upgrades[enchantedSlots[i]].id * 0.001;
			}

			Game.EnchantedPermanentSlotIcon=function(slot) {
				if (Game.EnchantedPermanentUpgrades[slot]==-1) return [slot,0,kaizoCookies.images.custImg];
				return Game.UpgradesById[Game.EnchantedPermanentUpgrades[slot]].icon;
			}

			Game.AssignEnchantedPermanentSlot=function(slot) {
				PlaySound('snd/tick.mp3');
				Game.tooltip.hide();
				var list=[];
				for (var i in Game.Upgrades)
				{
					var me=Game.Upgrades[i];
					if (((me.bought && me.unlocked) || (me.alwaysPermaslottable && me.everBought)) && !me.noPerm && (me.pool=='cookie' || (me.pool=='' && slot < 3)))
					{
						var fail=0;
						for (var ii in Game.permanentUpgrades) {if (Game.permanentUpgrades[ii]==me.id) fail=1;}
						for (var ii in Game.EnchantedPermanentUpgrades) {if (Game.EnchantedPermanentUpgrades[ii]==me.id) fail=1;}
						if (!fail) list.push(me);
					}
				}
				
				var sortMap=function(a,b)
				{
					if (a.order>b.order) return 1;
					else if (a.order<b.order) return -1;
					else return 0;
				}
				list.sort(sortMap);
				
				var upgrades='';
				for (var i in list)
				{
					var me=list[i];
					upgrades+=Game.crate(me,'','PlaySound(\'snd/tick.mp3\');Game.PutUpgradeInEnchantedPermanentSlot('+me.id+','+slot+');','upgradeForPermanent'+me.id);
				}
				var upgrade=Game.EnchantedPermanentUpgrades[slot];
				Game.SelectingEnchantedPermanentUpgrade=upgrade;
				Game.Prompt('<id PickPermaUpgrade><h3>'+loc("Pick an upgrade to make permanent")+'</h3>'+
				
							'<div class="line"></div><div style="margin:4px auto;clear:both;width:120px;"><div class="crate upgrade enabled" style="'+writeIcon([slot, 0, kaizoCookies.images.custImg])+'"></div><div id="upgradeToSlotNone" class="crate upgrade enabled" style="'+writeIcon([0, 7])+'display:'+(upgrade!=-1?'none':'block')+';"></div><div id="upgradeToSlotWrap" style="float:left;display:'+(upgrade==-1?'none':'block')+';">'+(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'))+'</div></div>'+
							'<div class="block crateBox" style="overflow-y:scroll;float:left;clear:left;width:317px;padding:0px;height:250px;">'+upgrades+'</div>'+
							'<div class="block" style="float:right;width:152px;clear:right;height:234px;">'+loc("Here are all the upgrades you've purchased last playthrough.<div class=\"line\"></div>Pick one to permanently gain its effects!<div class=\"line\"></div>You can reassign this slot anytime you ascend.")+'</div>'
							,[[loc("Confirm"),'Game.EnchantedPermanentUpgrades['+slot+']=Game.SelectingEnchantedPermanentUpgrade;Game.BuildAscendTree();Game.ClosePrompt();'],loc("Cancel")],0,'widePrompt');
			}
			eval('Game.AssignPermanentSlot='+Game.AssignPermanentSlot.toString().replace('//check if not already in another permaslot', 'for (var ii in Game.EnchantedPermanentUpgrades) {if (Game.EnchantedPermanentUpgrades[ii]==me.id) fail=1;}'))
			Game.SelectingEnchantedPermanentUpgrade=-1;
			Game.PutUpgradeInEnchantedPermanentSlot=function(upgrade,slot)
			{
				Game.SelectingEnchantedPermanentUpgrade=upgrade;
				l('upgradeToSlotWrap').innerHTML='';
				l('upgradeToSlotWrap').style.display=(upgrade==-1?'none':'block');
				l('upgradeToSlotNone').style.display=(upgrade!=-1?'none':'block');
				l('upgradeToSlotWrap').innerHTML=(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'));
			}

			this.achievements.push(new Game.Upgrade('Market manipulator', 'You gain momentum <b>5%</b> slower.<br>You gain <b>x1.0<span></span>5</b> CpS for every <b>x2</b> CpS multiplier from your purity.<q>Inflation? Deflation? No problem! Just call the F23s!</q>', 1000000000000, [24, 2, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Sucralosia Inutilis']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posY = -1468; Game.last.posX = 152;

			decay.offBrandFingers = [];

			//potentially have them increase click halt power instead?
			this.achievements.push(new Game.Upgrade('Illustrium fingernails', 'Clicking halts decay <b>10%</b> faster.<q>This illustrious metal gleams with a teal-green light. It seems to be especially effective in stabilizing reality.</q>', 1e13, [0, 5, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Vegetable-oiled joints', 'Clicking halts decay <b>10%</b> faster.<q>Reject chemistry, embrace nature.</q>', 1e14, [0, 6, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Ultraviolet obliteration', 'Clicking halts decay <b>10%</b> faster.<q>The power of the sun imprinted on my hand...</q>', 1e16, [0, 7, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Method acting', 'Clicking halts decay <b>10%</b> faster.<q>Oh no, my hands are on fire!</q>', 1e20, [0, 8, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Sinister glint', 'Clicking halts decay <b>10%</b> faster.<q>...</q>', 1e26, [0, 9, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Future clicks', 'Clicking halts decay <b>10%</b> faster.<q>In the future, clicking will be eternal.</q>', 1e34, [0, 10, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Shanzhai glucosium', 'Clicking halts decay <b>10%</b> faster.<q>Despite its off-brand status, it is somehow better than the original. Just for this one.</q>', 1e46, [0, 11, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			for (let i in decay.offBrandFingers) {
				decay.offBrandFingers[i].order = 110 + 0.0001 * decay.offBrandFingers[i].id;
			}

			this.createHeavenlyUpgrade('Vial of challenges', 'Unlocks <b>new challenges</b> for the <b>Unshackled decay</b> challenge mode.<br>Also <b>disables building requirements</b> for buying new buildings, automatically unlocks Force the Hand of Fate and Godzamok, and refunds sugar lumps spent if already unlocked.<br>This upgrade was unlocked after obtaining at least <b>'+Beautify(20000)+'</b> total prestige levels.<q>Quite concentrated, in fact.</q>', 1, [9, 0, kaizoCookies.images.custImg], ['Persistent memory'], 218, -115);
			Game.last.showIf = function() {
				return Game.prestige > 20000;
			}
			Game.last.buyFunction = function() {
				if (gp.spells['hand of fate'].unlocked) {
					Game.gainLumps(gp.spells['hand of fate'].unlockPrice);
				}
				gp.spells['hand of fate'].unlocked = true;
				gp.updateLumpLocks();
			}

			this.createHeavenlyUpgrade('Box of challenges', 'Unlocks <b>new challenges</b> for the <b>Unshackled decay</b> challenge mode.<br>This upgrade was unlocked after obtaining at least <b>'+Beautify(3e6)+'</b> total prestige levels.<q>It\'s full of fun!</q>', 1, [8, 0, kaizoCookies.images.custImg], [], Game.Upgrades['Twin Gates of Transcendence'].posX + 200, Game.Upgrades['Twin Gates of Transcendence'].posY - 70);
			Game.last.showIf = function() {
				return Game.prestige > 3e6;
			}

			this.createHeavenlyUpgrade('Truck of challenges', 'Unlocks <b>new challenges</b> for the <b>Unshackled decay</b> challenge mode.<q>Is a truck really necessary for this...?</q>', 1, [10, 0, kaizoCookies.images.custImg], ['Enchanted Permanent upgrade slot IV'], -950, -830);
			Game.last.showIf = function() {
				return decay.challengeStatus(4);
			}

			decay.multiFingers = [];
			this.achievements.push(new Game.Upgrade('Shell breaker', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Wrinklers have a very hard and resilient shell, but luckily, rapid clicks alongside a sharp tip can help with that!</q>', 1e8, [12, 5, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Liquidating touch', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>What? It\'s just bleach.</q>', 1e9, [12, 6, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Carbon disintegration', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>It\'s so hot!</q>', 5e9, [12, 7, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Rare earths', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Wrinklers are allergic to them, apparently. There has not been any conclusive scientific research about this topic.</q>', 1e10, [12, 8, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Holy glow', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Looks... a bit different than I expected.</q>', 1e15, [12, 9, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Click flurry', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Lets you get 1.15 clicks per click!</q>', 1e19, [12, 10, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Lunar flares', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Rains down lunar flares... wait, wrong game.</q>', 1e24, [12, 11, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			for (let i in decay.multiFingers) {
				decay.multiFingers[i].order = 120 + 0.0001 * decay.multiFingers[i].id;
			}

			this.achievements.push(new Game.Upgrade('Touch of nature', 'Big cookie clicks have a <b>1%</b> chance to purify a small amount of decay.<q>Within this mouse... is the power to stop your misery!</q>', 1e57, [11, 4, kaizoCookies.images.custImg])); Game.last.order = 160;

			this.achievements.push(new Game.Upgrade('Chance encounter', 'Frenzy from golden cookies last <b>35%</b> longer.<br>Unlocks after clicking <b>27</b> naturally spawning golden cookies this ascension.<q>May chance be on your side.</q>', 777.777777e45, [11, 3, kaizoCookies.images.custImg])); Game.last.order = 5000.1;

			this.achievements.push(new Game.Upgrade('Lucky radar', 'Golden cookie gain is <b>doubled</b>.<br>Golden cookie gain refers to any effect from golden cookies that involves directly creating some amount of cookies, such as Lucky.<q>Really helpful for finding those lucky cookies that just won\'t come out of the abyss.</q>', 7.777e8, [10, 14])); Game.last.order = 4950;
			this.achievements.push(new Game.Upgrade('Shimmering encapsulation', 'Golden cookie gain is <b>doubled</b>.<br>Golden cookie gain refers to any effect from golden cookies that involves directly creating some amount of cookies, such as Lucky.<q>The essence of golden cookies, redistributed.</q>', 7.777e11, [10, 2, kaizoCookies.images.custImg])); Game.last.order = 4951;
			this.achievements.push(new Game.Upgrade('Immense flow', 'Golden cookie gain is <b>doubled</b>.<br>Golden cookie gain refers to any effect from golden cookies that involves directly creating some amount of cookies, such as Lucky.<q>The RNG must flow!</q>', 7.7777e14, [11, 2, kaizoCookies.images.custImg])); Game.last.order = 4952;

			this.achievements.push(new Game.Upgrade('Muscle relaxant', 'The mouse is <b>four times</b> as efficient.<q>Really helps with jitter clicking, you know the feeling?</q>', 50, [1, 6])); Game.last.order = 105;
			this.achievements.push(new Game.Upgrade('Trigger fingers', 'The mouse is <b>four times</b> as efficient.<q>Manually baking faster than ever.</q>', 5000, [12, 1])); Game.last.order = 105.1;
			this.achievements.push(new Game.Upgrade('Non-euclidean baking trays', 'The mouse is <b>four times</b> as efficient.<q>Those clicks could really use some geometry.</q>', 500000, [12, 2])); Game.last.order = 105.2;
			replaceDesc('Reinforced index finger', 'The cursor is <b>twice</b> as efficient and the mouse is <b>4 times</b> as efficient.', true);
			replaceDesc('Carpal tunnel prevention cream', 'The cursor is <b>twice</b> as efficient and the mouse is <b>4 times</b> as efficient.', true);
			replaceDesc('Ambidextrous', 'The cursor is <b>twice</b> as efficient and the mouse is <b>4 times</b> as efficient.', true);

			this.achievements.push(new Game.Upgrade('Santaic doom', 'Wrinklers take <b>1%</b> more damage for each santa level past Elfling.<q>Filth begone!</q>', 5e14, [18, 9])); Game.last.order = 25001;

			this.achievements.push(new Game.Upgrade('Memory capsule', 'Research is <b>twice</b> as fast.<q>Only if it could travel with you, through the afterlife...</q>', 1e16, [11, 1, kaizoCookies.images.custImg])); Game.last.order = 15010;
			Game.last.priceFunc = function() {
				return Game.Upgrades['Memory capsule'].basePrice * (decay.challengeStatus('pledge')?0:1);
			}

			const nameList = [
				'Carpal miniaturization',
				'Permanent residence',
				'Rooftop botanies', 
				'Collapsing extraction',
				'Sub-minimum wages',
				'Starter funds',
				'Saints of the world',
				'Magic',
				'Hyperspeed railguns',
				'100% organic hyper-catalysts',
				'At home',
				'Future heist',
				'The medicore force',
				'Blackbody indigestion',
				'Ordinary beginner\'s luck',
				'Enlarging rays',
				'Clean code',
				'Buy-one-get-one-free universes',
				'Puberty',
				'Brotherhood'
			];
			const flavorTextList = [
				'Oh ho ho ho... small cursors!',
				'Wouldn\'t be nice if, let\'s say, you kept some of the grandmas by your side...?',
				'No cities left unfarmed.',
				'Above you is a sign that reads: "mine 107". Within the rubbles, you notice a sign that reads: "mine 106".',
				'Who needs money, anyways?',
				'An enormous paycheck for the growth of your business - and you just have to deliver a satisfactory result.',
				'...all of them, standing besides me.',
				'What? It\'s magic!',
				'Powered by the force of [REDACTED], catapulting your rockets into space.',
				'Made entirely out of natural ingredients! (and a pinch of animal cruelty, but don\'t pleaseeeee tell anyone that)',
				'We have some of those eldritch portals at home. Eldritch portals',
				'We need miniaturization projectors for sure. Oh and also, a cloak of invisibility.',
				'In between the unbreakable bonds of the strong force, and the stealthy attacks of the weak force, we have you.',
				'A little bit of constipation couldn\'t hurt.',
				'Make sure to vault secrets!',
				'Sub-fractal de-fractalizing fractals fractioning fractal engines.',
				'Now that all the troubles we currently face has been abstracted away, we can finally get started on the problems we currently don\'t face!',
				'On sale now! Limited offer!',
				'More energized and active than ever! (side effects may include impulsiveness, agitation, depression, procrastination, anxiety, introversion, extraversion, "being young", [REDACTED], breaking prison, confusion, lipid buildup, addiction (to cookies), gastrointestional screaming, leaky brains, an education, bankruptcy, and sudden death syndrome.)',
				'For optimal performance.'
			];
			this.polargurtUpgrades = [];
			Game.Tiers['polar'] = {
				name: 'Polargurt',
				unlock: -1,
				iconRow: 0,
				color: '#ffdd4f',
				special: 1,
				upgrades: this.polargurtUpgrades
			}
			for (let i in Game.Objects) {
				this.achievements.push(new Game.Upgrade(nameList[Game.Objects[i].id], 'Price scaling for '+Game.Objects[i].bplural+' are pushed back by <b>10</b> buildings.<q>'+flavorTextList[Game.Objects[i].id]+'</q>', Game.Objects[i].basePrice * (1 + Game.Objects[i].id), [((Game.Objects[i].id<16?0:-11)+Game.Objects[i].iconColumn), 12, kaizoCookies.images.custImg])); 
				Game.last.order = 6000 + Game.Objects[i].id * 0.01;
				Game.last.buyFunction = (function(b) { return function() {
					b.free += 10;
					Game.storeToRefresh = 1;
				} })(Game.Objects[i]);
				Game.MakeTiered(Game.last, 'polar');
				this.polargurtUpgrades.push(Game.last);
			}
			this.applyPolargurt = function() {
				for (let i in this.polargurtUpgrades) {
					if (Game.Has(this.polargurtUpgrades[i].name)) {
						Game.ObjectsById[i].free += 10;
					}
				}
				Game.storeToRefresh = 1;
			}
			this.checkPolargurt = function() {
				for (let i = 0; i < this.polargurtUpgrades.length; i++) {
					if (Game.log10Cookies > 2.5 + i * 1 && Game.ObjectsById[i].bought > 0) { 
						Game.Unlock(this.polargurtUpgrades[i].name); 
					}
				}
			}
			eval('Game.LoadSave='+Game.LoadSave.toString()
				.replace(`Game.Objects['Cursor'].free=10;`, `Game.Objects['Cursor'].free+=10;`)
				.replace(`Game.Objects['Grandma'].free=5;`, `Game.Objects['Grandma'].free+=5;`)
				.replace('if (Game.ascensionMode!=1)', 'for (let i in Game.Objects) { Game.Objects[i].free = 0; } kaizoCookies.applyPolargurt(); for (let i in decay.seFrees) { Game.ObjectsById[i].getFree(decay.seFrees[i]); } if (Game.ascensionMode!=1)'));

			this.createHeavenlyUpgrade('Wrinkly balls', 'Evolving Santa requires <b>1 less</b> normal wrinkler soul per level.<q>A set of 14 cute - albeit disgusting - balls of wrinkler conglomerate, they are often used as a substitute for wrinkler souls.', 2222, [11, 0, kaizoCookies.images.custImg], ['Season switcher'], Game.Upgrades['Season switcher'].posX, Game.Upgrades['Season switcher'].posY + 150, 182);

			this.achievements.push(new Game.Upgrade('Santaic zoom', 'Wrinkler souls halt decay for <b>1%</b> longer per Santa level past Elfling.<q>Let the goodness take hold.</q>', 5e14, [18, 9])); Game.last.order = 25011;

			this.createHeavenlyUpgrade('Rift to the beyond', 'While having no purity and is not coagulated, decay is <b>twice</b> as slow.<q>Let us go, together.</q>', 12000, [1, 3, kaizoCookies.images.custImg], ['Enchanted Permanent upgrade slot I'], -720, -380, 288);

			addLoc('Improved by challenge <b>%1</b>!');
			this.achievements.push(new Game.Upgrade('Molten piercer', 'Destroys wrinklers after only depleting the health of the second to last layer.<q>And you also get more wrinkler gore! Isn\'t it nice?</q>', 3.3e18, [15, 1, kaizoCookies.images.custImg])); Game.last.order = 159;
			Game.last.descFunc = function() { return (decay.challengeStatus('purity1')?('<div style="text-align: center;">'+loc('Improved by challenge <b>%1</b>!', decay.challenges['purity1'].name)+'</div><div class="line"></div>'):'') + Game.Upgrades['Molten piercer'].desc; }

			this.rhodorangeUpgrades = [];
			Game.Tiers['bloodOrange'] = {
				name: 'Rhodorange',
				unlock: -1,
				iconRow: 0,
				color: '#ff9036',
				special: 1,
				upgrades: this.rhodorangeUpgrades
			};
			const nameList2 = [
				'Bazillion fingers',
				'Rolling pin pins',
				'A very special watering can',
				'Labor at all costs',
				'Intensive manufacturers',
				'ChStTh-onk',
				'Bodily worships',
				'Unscientific science',
				'Green engines',
				'Cerebral transmutations',
				'Trans-dimensional conveyor',
				'Dilated time',
				'Parity vacuums',
				'Echo chambers',
				'A 9.007 quadrillion sided die',
				'Systematic rescaling',
				'Frameworks',
				'The universal shredder',
				'An actual central nervous system in the center',
				'Integrated entertainment'
			];
			const flavorTextList2 = [
				'How many fingers is that exactly? Who knows!',
				'Good for pinning awards to the walls of your home.',
				'Who needs those sprinklers when you have these?',
				'Let\'s go mining!',
				'Both on the environment and on themselves.',
				'Unfortunately, waffles are not cookies.',
				'Blood! Shed!',
				'In which you call upon unpredictable forces of nature to help with cookie production.',
				'...to those who prove themselves worthy.',
				'What a smart cookie you are!',
				'Hey, wouldn\'t it be nice to retrieve a large amount of cookies without having to go through all that massive hunks of metal?',
				'How have we still not thought of this yet?',
				'Despite how powerful your antimatter condensers are, getting the antimatter to them remains an issue. This should resolve that issue by selectively sucking up only antimatter!',
				'Might be a bit harsh on the prisms themselves, but it\'s still nothing compared to the extra cookies it would produce.',
				'The maximum a die can handle before losing faces.',
				'Useful for when the recursion goes on for more than 3,200 layers.',
				'Yeah we get it, Javascript sucks. But with this, it can suck just a little bit less while increasing the amount of prerequisites tenfold.',
				'Sometimes, there are too many universes devoid of material and extraction becomes difficult. This should help with that!',
				'With this revoluntary invention, we can finally properly coordinate the various parts of the brain!',
				'Eternally active.'
			];
			const powerList = [
				50,
				100,
				180,
				170,
				160,
				150,
				140,
				130,
				120,
				110,
				100,
				90,
				80,
				70,
				60,
				50,
				40,
				30,
				20,
				10
			];
			for (let i in Game.Objects) {
				this.achievements.push(new Game.Upgrade(nameList2[Game.Objects[i].id], cap(Game.Objects[i].plural)+' are <b>'+powerList[Game.Objects[i].id]+'%</b> more efficient.<q>'+flavorTextList2[Game.Objects[i].id]+'</q>', Math.max(Math.max(Game.Objects[i].basePrice * 1.234, 1e3 * Math.pow(6, 1 + Game.Objects[i].id)), (1 / 1e8) * Math.pow(69, 1 + Game.Objects[i].id)), [((Game.Objects[i].id<16?0:-11)+Game.Objects[i].iconColumn), 13, kaizoCookies.images.custImg])); 
				Game.last.order = 6010 + Game.Objects[i].id * 0.01;
				Game.last.boostPower = powerList[Game.Objects[i].id] / 100 + 1;
				Game.MakeTiered(Game.last, 'bloodOrange');
				Game.Objects[i].rhodorange = Game.last;
				this.rhodorangeUpgrades.push(Game.last);
			}
			Game.Upgrades['Bazillion fingers'].basePrice *= 1e9;
			this.checkRhodorange = function() {
				for (let i = 0; i < this.rhodorangeUpgrades.length; i++) {
					if (Game.ObjectsById[i].amount > 0 && Game.cookiesEarned > this.rhodorangeUpgrades[i].basePrice) { Game.Unlock(this.rhodorangeUpgrades[i].name); }
				}
			}
			decay.rhodorangeBoost = function(name) {
				return Game.Has(Game.Objects[name].rhodorange.name)?Game.Objects[name].rhodorange.boostPower:1;
			}

			this.achievements.push(new Game.Upgrade('Blessed monuments', 'Clicking halts decay <b>10%</b> faster.<q>Monuments endorsed by the gods, made just for you.</q>', 1.234e10, [11, 22])); Game.last.order = 160;
			this.achievements.push(new Game.Upgrade('Paint of proof', 'Clicking halts decay <b>10%</b> faster.<q>You\'ve come so far... why not keep going?</q>', 2.345e11, [11, 23])); Game.last.order = 160.01;
			this.achievements.push(new Game.Upgrade('Integrated alloys', 'Clicking halts decay <b>10%</b> faster.<q>Inner strength comes from experience.</q>', 3.456e12, [11, 24])); Game.last.order = 160.02;

			this.createHeavenlyUpgrade('Stabilizing crystal', 'The decay speed and strength increase with purity is slightly slower.<q>Insignificant... or is it?</q>', 120000, [22, 0, kaizoCookies.images.custImg], ['Rift to the beyond', 'Enchanted Permanent upgrade slot II'], -880, -490, 289);
			Game.last.showIf = function() { return decay.challengeStatus(2); }

			//credits for the two tiers below goes to fifi :heart:
			this.eldersiteUpgrades = [];
			Game.Tiers['eldersite'] = {
				name: 'Eldersite',
				unlock: -1,
				iconRow: 0,
				color: 'rgb(54, 101, 255)',
				special: 1,
				upgrades: this.eldersiteUpgrades
			};
			const nameList3 = [
				'Poky fingers',
				'Niceness',
				'Special "water"',
				'Increased work hours',
				'Infant labour',
				'Dedollarization',
				'Goodbye declaration',
				'Level 9 spellbooks',
				'Chocolate nebulae',
				'Ag+',
				'Robot visitors',
				'Memory',
				'Anti-condensers',
				'Tesseract',
				'Luck balancer',
				'Mandatory meta reference',
				'ReferenceError',
				'Defunct waffle shops',
				'Sound business decisions',
				'Caste system'
			];
			const flavorTextList3 = [
				'You have no carrots to give to the cookie, so why not the stick instead?',
				'Apparently hitting your grandmas for not finishing their food reduces productivity? Who could have guessed!',
				'Turns out watering your crops with wastewater from the pig farms speeds up growth of the cookies. Gives a slightly rancid taste to your cookies, but what about that 5% increased growth rate?',
				'Ah, how obvious this was! How could you have missed that for so long…',
				'Almost snatching them from the cradle.',
				'With traditional currency going obsolete anyway, might as well remove it altogether.',
				'Besides yourself of course, what is the use of any other gods? Simply a removal of your <s>cult\'s</s> religion\'s support.',
				'Requiring tens of hours to obtain even with your most powerful wizards, these contain what is probably the highest and hardest class of magic there is.',
				'Sequel to the vanilla ones.',
				'From one stable currency to another.',
				'Finally a solution to the immense number of casualties daily!',
				'Your engineers have figured out a way to go back to a certain time based on a memory, and the results are… remarkable.',
				'Not to be confused with Antimatter condensers.',
				'Not to be confused with a certain reddit moderator.',
				'Sometimes you would like a little bad luck for a change.',
				'Yes, I have ran out of ideas for these flavour texts. How could you have known?',
				'ReferenceError: Can\'t find variable: UpgradeText',
				'Nevermind, more cookies for you!',
				'Better than anything those pesky humans can do.',
				'By tampering with fetuses and enhanced conditioning, you\'ve managed to create tangible differences in the IQ of different clones, making them suitable for their own type of work. After all, why should an Alpha do an Epsilion\'s work? They would go insane.'
			];
			for (let i in Game.Objects) {
				this.achievements.push(new Game.Upgrade(nameList3[Game.Objects[i].id], loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[i].plural))+'<q>'+flavorTextList3[Game.Objects[i].id]+'</q>', Game.Objects[i].basePrice * 5 * Math.pow(123, Math.max(Game.Objects[i].id - 8, 0)), [((Game.Objects[i].id<16?0:-11)+Game.Objects[i].iconColumn), 16, kaizoCookies.images.custImg])); 
				Game.last.order = 6020 + Game.Objects[i].id * 0.01;
				Game.MakeTiered(Game.last, 'eldersite');
				Game.Objects[i].eldersite = Game.last;
				this.eldersiteUpgrades.push(Game.last);
			}
			this.checkEldersite = function() {
				const c = Game.cookieClicks + decay.clicksKept;
				for (let i = 0; i < this.eldersiteUpgrades.length; i++) {
					if (Game.ObjectsById[i].amount > 0 && Game.cookiesEarned > this.eldersiteUpgrades[i].basePrice && c > (1000 + i * 100) * (Game.Has('Phantom clicks')?0.5:1)) { Game.Unlock(this.eldersiteUpgrades[i].name); }
				}
			}
			decay.eldersiteBoost = function(name) {
				return Game.Has(Game.Objects[name].eldersite.name) + 1;
			}

			this.malachillaUpgrades = [];
			Game.Tiers['malachilla'] = {
				name: 'Malachilla',
				unlock: -1,
				iconRow: 0,
				color: 'rgb(180, 255, 207)',
				special: 1,
				upgrades: this.malachillaUpgrades
			};
			const nameList4 = [
				'Chocolate nail polish',
				'Body ovens',
				'Semi-permeable ground',
				'Diamond pickaxes',
				'Specialty managers',
				'Post-mortal debt',
				'Loudspeakers',
				'Taller towers',
				'Rooms at the back',
				'Crystal chemistry',
				'The other side of the portal',
				'The fourth hand',
				'The C Boson',
				'Interference filters',
				'One-sided die',
				'Glasses',
				'CookieOS',
				'Milkfalls',
				'Satellite brains',
				'Performance enhancing drugs'
			];
			const flavorTextList4 = [
				'This cookie. Truly astounding chocolate chips there is.',
				'This grandma is over 100! (degrees)',
				'Finally, an elegant solution for keeping your cookie plants growing and healthy! With a brownish substance containing all sorts of elements from the periodic table, plus a handful of dihydrogen monoxide and some electromagnetic radiation, you can be sure that your cookie plants are fruiting sooner than ever!',
				'As powerful as steel, while having a mind-blowing 5 hp!',
				'Promising a patrolling rate of once per minute.',
				'Though, the holy water supply is really becoming an issue.',
				'Also useful for telling adventurers to back away in cases of divine wrath.',
				'Tall towers tell towering tales.',
				'Just one big room at the back of the ship for extra storage. God forbid if it starts expanding into infinitely many nearly identical but slightly different rooms.',
				'The cookies could always use a bit more crunch.',
				'Double the entry points, double the cookie output.',
				'In your unthinkable genius, you have figured out how to add a fourth clock hand to your time machines! Hmm. Maybe it’s best to not touch it.',
				'There are many things C could stand for. Cookies, chocolate, or perhaps cream. But does it really matter?',
				'So that your prisms can produce more cookies and stop producing those (hilarious, but) wasteful twokies.',
				'Aha! Now you can never get the wrong rolls!',
				'Not only useful to grandmas.',
				'An operating system optimized for making cookies.',
				'To collect your cookies, just drop them in the flowing milk!',
				'An expansive web of miniature cortex bakers, they connect the neural planets with each other and themselves, minimizing time spent coordinating and freeing up those precious moments into creating more cookies as well.',
				'It works, but at what cost?'
			];
			for (let i in Game.Objects) {
				this.achievements.push(new Game.Upgrade(nameList4[Game.Objects[i].id], loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[i].plural))+'<q>'+flavorTextList4[Game.Objects[i].id]+'</q>', Game.Objects[i].basePrice * 55 * Math.pow(4444, Math.max(Game.Objects[i].id - 10, 0)), [((Game.Objects[i].id<16?0:-11)+Game.Objects[i].iconColumn), 17, kaizoCookies.images.custImg])); 
				Game.last.order = 6030 + Game.Objects[i].id * 0.01;
				Game.MakeTiered(Game.last, 'malachilla');
				Game.Objects[i].malachilla = Game.last;
				this.malachillaUpgrades.push(Game.last);
			}
			this.checkMalachilla = function() {
				const c = Game.cookieClicks + decay.clicksKept;
				for (let i = 0; i < this.malachillaUpgrades.length; i++) {
					if (Game.ObjectsById[i].amount > 10 && Game.cookiesEarned > this.malachillaUpgrades[i].basePrice && c > (1500 + i * 150) * (Game.Has('Phantom clicks')?0.5:1)) { Game.Unlock(this.malachillaUpgrades[i].name); }
				}
			}
			decay.malachillaBoost = function(name) {
				return Game.Has(Game.Objects[name].malachilla.name) + 1;
			}

			this.achievements.push(new Game.Upgrade('A golden hat', 'Leveling the Santa takes <b>half</b> as many souls and shiny souls.<q>Must be quite an expensive bribe indeed.</q>', 1e19, [16, 2, kaizoCookies.images.custImg])); Game.last.order = 24999;
			Game.last.priceFunc = function() {
				return (decay.challengeStatus('buildingCount')?0.1:1) * Game.Upgrades['A golden hat'].basePrice;
			}

			this.achievements.push(new Game.Upgrade('Soul compression', 'While exhausted, claiming wrinkler souls clear <b>half a second</b> worth of exhaustion.<q>Smaller souls make for an easier ingestion.</q>', 3.6e18, [16, 3, kaizoCookies.images.custImg])); Game.last.order = 25070; 
			this.achievements.push(new Game.Upgrade('Weightlessness', 'While exhausted, normal and shiny wrinkler souls halt decay for <b>10%</b> longer.<q>Reducing the required processing time by removing the need for supports.</q>', 3.6e33, [17, 3, kaizoCookies.images.custImg])); Game.last.order = 25071;

			this.createHeavenlyUpgrade('Thunder marker', 'Creates a draggable marker; whenever power click shockwaves pass through it, it creates an additional, smaller power click shockwave that hits all wrinklers in range for <b>150%</b> the damage of the original shockwave.<q>Let the destruction unfold!</q>', 1.2e6, [17, 2, kaizoCookies.images.custImg], ['Unholy bait', 'Enchanted Permanent upgrade slot III'], -625, -690, 272);
			Game.last.showIf = function() { return decay.challengeStatus(3); }

			Game.Upgrades['Lucky digit'].showIf = function() { return Game.prestige > 7777; }
			replaceDesc('Lucky digit', Game.Upgrades['Lucky digit'].baseDesc.replace('your prestige level contains a 7', 'your prestige level is higher than 7777'));
			Game.Upgrades['Lucky number'].showIf = function() { return Game.prestige > 7777777; }
			replaceDesc('Lucky number', Game.Upgrades['Lucky number'].baseDesc.replace('your prestige level contains two 7\'s', 'your prestige level is higher than 7777777'));
			Game.Upgrades['Lucky payout'].showIf = function() { return Game.prestige > 7777777777; }
			replaceDesc('Lucky payout', Game.Upgrades['Lucky payout'].baseDesc.replace('your prestige level contains four 7\'s', 'your prestige level is higher than 7777777777'));

			let unshackledPurityPosX = Game.Upgrades['Unshackled Purity'].posX;
			let unshackledPurityPosY = Game.Upgrades['Unshackled Purity'].posY;
			this.createHeavenlyUpgrade('Purity chips', 'Each digit in the amount of heavenly chips you have unspent grants you <b>+100%</b> initial purity on reincarnation.<q>To be this pure, this chip was put through 15 separate steps of distillation.</q>', 1e11, [18, 2, kaizoCookies.images.custImg], ['Unshackled flavor', 'Unshackled berrylium', 'Unshackled blueberrylium'], unshackledPurityPosX + (Game.Upgrades['Unshackled berrylium'].posX - unshackledPurityPosX) / 2, unshackledPurityPosY + (Game.Upgrades['Unshackled berrylium'].posY - unshackledPurityPosY) / 2, 300);
			this.createHeavenlyUpgrade('Purity stand', 'Clicking halts decay <b>10% harder</b>.<q>Pure and heavenly, a masterful fusion of elements.</q>', 8e11, [19, 2, kaizoCookies.images.custImg], ['Purity chips', 'Unshackled chalcedhoney', 'Unshackled buttergold', 'Unshackled sugarmuck'], unshackledPurityPosX + (Game.Upgrades['Unshackled buttergold'].posX - unshackledPurityPosX) / 2, unshackledPurityPosY + (Game.Upgrades['Unshackled buttergold'].posY - unshackledPurityPosY) / 2, 300.01);
			this.createHeavenlyUpgrade('Purity bakery', 'You <b>purify decay</b> over time while decay is halted with enough power.<q>The tiny has grown into something massive, something extraordinary.</q>', 6e12, [18, 3, kaizoCookies.images.custImg], ['Purity stand', 'Unshackled jetmint', 'Unshackled cherrysilver', 'Unshackled hazelrald'], unshackledPurityPosX + (Game.Upgrades['Unshackled cherrysilver'].posX - unshackledPurityPosX) / 2, unshackledPurityPosY + (Game.Upgrades['Unshackled cherrysilver'].posY - unshackledPurityPosY) / 2, 300.02);
			this.createHeavenlyUpgrade('Purity factory', 'All purity caps are <b>50%</b> higher.<q>The universe\'s the limit.</q>', 4e13, [19, 3, kaizoCookies.images.custImg], ['Purity bakery', 'Unshackled mooncandy', 'Unshackled astrofudge', 'Unshackled alabascream'], unshackledPurityPosX + (Game.Upgrades['Unshackled astrofudge'].posX - unshackledPurityPosX) / 2, unshackledPurityPosY + (Game.Upgrades['Unshackled astrofudge'].posY - unshackledPurityPosY) / 2, 300.03);
			this.createHeavenlyUpgrade('Purity key', 'Upon getting at least <b>+1,000%</b> purity for at least <b>5 seconds</b> for the first time in an ascension, it becomes charged; it discharges when decay breaks, which <b>purifies all decay</b>, damages and stuns all wrinklers, and applies a buff to completely <b>stop wrinkler spawning</b> for <b>36 seconds</b>.<q>The purity... it\'s overflowing!</q>', 2e14, [20, 3, kaizoCookies.images.custImg], ['Purity factory', 'Unshackled iridyum', 'Unshackled glucosmium', 'Unshackled glimmeringue'], unshackledPurityPosX + (Game.Upgrades['Unshackled glucosmium'].posX - unshackledPurityPosX) / 2, unshackledPurityPosY + (Game.Upgrades['Unshackled glucosmium'].posY - unshackledPurityPosY) / 2, 300.04);
			Game.Upgrades['Unshackled Purity'].parents = ['Purity chips', 'Purity stand', 'Purity bakery', 'Purity factory', 'Purity key'];
			for (let i in Game.Upgrades['Unshackled Purity'].parents) { Game.Upgrades['Unshackled Purity'].parents.splice(parseInt(i), 1, Game.Upgrades[Game.Upgrades['Unshackled Purity'].parents[i]]); }

			this.createHeavenlyUpgrade('Click-o-meter extension', 'The click-o-meter now shows the amount of time left on hover. <q>Also comes with a nice remote-activated LED screen!</q>', 1, [18, 0, kaizoCookies.images.custImg], ['Twin Gates of Transcendence'], Game.Upgrades['Twin Gates of Transcendence'].posX + 120, Game.Upgrades['Twin Gates of Transcendence'].posY, 273.5);
			Game.Upgrades['Box of challenges'].parents = [Game.Upgrades['Click-o-meter extension']];

			addLoc('No souls to pull!');
			addLoc('Protocol No escape activated!');
			addLoc('Souls slowed!');
			new decay.scroll('Scroll of no escape', 'Type "stop" to <b>freeze</b> all wrinkler souls on screen for <b>8 seconds</b>!<q>You shall not leave!</q>', 1e6, [28, 1, kaizoCookies.images.custImg], ['Script writer'], 313, 741, 'stop', 2 * 60, function() { 
				Game.Notify(loc('Protocol No escape activated!'), loc('Souls slowed!'), [15, 3, kaizoCookies.images.custImg]); 
				Game.gainBuff('reverseMomentum', 8); 
				Crumbs.spawn(decay.whiteFlash, { scope: 'left' });
				const souls = Crumbs.getObjects('s');
				for (let i in souls) { 
					souls[i].behaviors[0].dx *= 0.3;
					souls[i].behaviors[0].dy *= 0.3;
				}
			});
			addLoc('Wrinkler soul deceleration for %1!');
			new Game.buffType('reverseMomentum', function(time) {
				return {
					name: 'Reversed momentum',
					desc: loc('Wrinkler soul deceleration for %1!', Game.sayTime(time * Game.fps)),
					time: time * Game.fps,
					icon: [1, 7]
				}
			});
			decay.whiteFlash = {
				alpha: 0.5,
				speed: 0.5 / Game.fps,
				order: 1e7,
				components: new Crumbs.component.canvasManipulator({ function: function(m, ctx) { 
					const width = m.scope.l.width;
					const height = m.scope.l.height;
					ctx.globalAlpha = m.alpha;
					ctx.fillStyle = "#fff";
					ctx.fillRect(0, 0, width, height);
					ctx.globalAlpha = 1;
				} }),
				behaviors: new Crumbs.behavior(function() {
					this.alpha -= this.speed;
					if (this.alpha < 0) { this.die(); }
				})
			}
			//new decay.scroll('Scroll of glacial stasis', 'Type "freeze" '
			decay.prestigeEscalationScrollBoostCount = 0;
			decay.prestigeEscalationScrollBoostMax = 10;
			addLoc('Prestige maximally escalated!');
			addLoc('Scroll activated!');
			addLoc('Prestige escalating in progress...');
			addLoc('Prestige escalation complete!');
			addLoc('Current cumulative effects: +%1% prestige unleashed')
			new decay.scroll('Scroll of prestige escalation', 'Type "unleash the potential" to increase the amount of prestige unleashed by <b>15%</b> for up to <b>+150%</b>, lasting until the end of the current run.<q>A nice, eldritch chant to force your prestige points into eternal turmoil.</q>', 1e8, [28, 4, kaizoCookies.images.custImg], ['Scroll of no escape'], 484, 830, 'unleash the potential', 6 * 60, function() { 
				if (decay.prestigeEscalationScrollBoostCount >= decay.prestigeEscalationScrollBoostMax + Game.Has('Scroll of prestige unbound') * 5) { Game.Notify(loc('Prestige maximally escalated!'), '', 0, 2); return; } 
				Crumbs.spawn(decay.prestigeEscalationAnimationObject); 
				Game.Notify(loc('Scroll activated!'), loc('Prestige escalating in progress...'), [28, 4, kaizoCookies.images.custImg]);
			});
			decay.prestigeEscalationAnimationObject = {
				scope: 'foreground',
				id: 'prestigeEscalationAnimation',
				timeActive: 5 * Game.fps,
				behaviors: new Crumbs.behaviorInstance(function() {
					this.y = this.scope.l.offsetHeight * (1 - (Crumbs.t - this.t) / this.timeActive);
					if (Crumbs.t - this.t >= this.timeActive) { this.die(); decay.veilBackgroundGlintParticle.curvePow = 0.5; Game.Notify(loc('Prestige escalation complete!'), loc('Current cumulative effects: +%1% prestige unleashed', Beautify(Math.round(decay.prestigeEscalationScrollBoostCount * 15)), 2), [28, 4, kaizoCookies.images.custImg]); return; }
					decay.prestigeEscalationScrollBoostCount = Math.min(decay.prestigeEscalationScrollBoostCount + 1 / this.timeActive, decay.prestigeEscalationScrollBoostMax + Game.Has('Scroll of prestige unbound') * 5);

					for (let i = 0; i < randomFloor(1.5); i++) { 
						decay.veilBackgroundGlintParticle.size = (Math.random() + 0.25) * 50;
						decay.veilBackgroundGlintParticle.maxLife = 2 * (Math.random() * 0.5 + 0.75) * Game.fps;
						decay.veilBackgroundGlintParticle.curvePow = 0.8;
						Crumbs.spawnParticle(decay.veilBackgroundGlintParticle, Math.random() * this.scope.l.offsetWidth, this.y - 40, Math.random() * Math.PI, 1, 'foreground'); 
					}
				})
			};
			new decay.scroll('Scroll of opportune power', 'Type "i need an orb" to spawn a power orb instantly.<q>More power orbs! What\'s not to love?</q>', 2e8, [28, 5, kaizoCookies.images.custImg], ['Scroll of prestige escalation'], 472, 1006, 'i need an orb', 20 * 60, function() { new decay.powerOrb(); }) //comes after prestige escalation scroll

			this.createHeavenlyUpgrade('Phantom clicks', 'Each big cookie counts as <b>2</b> clicks for all upgrades that unlock based on click count.<q>Thankfully, the heavens don\'t have counterfeit detection.</q>', 666666, [2, 3, kaizoCookies.images.custImg], ['Stabilizing crystal'], -1048, -558, 253.0035);

			addLoc('Cooldown refreshed!');
			addLoc('Your Scroll of prestige escalation is ready to use again!');
			addLoc('Not enough souls!');
			addLoc('The scroll is not on cooldown!');
			new decay.scroll('Scroll of prestige unbound', 'Type "unleash the hidden will" to refresh the cooldown on the Scroll of prestige escalation, at the cost of <b>9 normal souls</b> or <b>3 shiny souls</b>, priortizing normal souls when both are available.<br>The effect cap of the Scroll of prestige escalation is increased to <b>+225%</b> unleashed prestige.', 2e8, [26, 4, kaizoCookies.images.custImg], ['Scroll of prestige escalation'], 626, 954, 'unleash the hidden will', 0, function() { 
				if (!decay.scrolls['Scroll of prestige escalation'].cooldown) { Game.Notify(loc('The scroll is not on cooldown!'), '', 0, 3); return; }

				if (decay.utenglobeStorage.soul.amount >= 9) {
					decay.utenglobeStorage.soul.lose(9);
				} else if (decay.utenglobeStorage.shinySoul.amount >= 3) {
					decay.utenglobeStorage.shinySoul.lose(3);
				} else {
					Game.Notify(loc('Not enough souls!'), '', 0, 3); return;
				}

				decay.scrolls['Scroll of prestige escalation'].cooldown = 0;
				Game.Notify(loc('Cooldown refreshed!'), loc('Your Scroll of prestige escalation is ready to use again!'), [26, 4, kaizoCookies.images.custImg], 6); 
				decay.checkHasScrollOnCooldown();
				decay.scrolls['Scroll of prestige escalation'].removeCooldownDisplay();

				if (!Game.prefs.particles) { return; }
				for (let i = 0; i < 120; i++) { 
					decay.veilBackgroundGlintParticle.size = (Math.random() + 0.25) * 50;
					decay.veilBackgroundGlintParticle.maxLife = 2 * (Math.random() * 0.5 + 0.75) * Game.fps;
					decay.veilBackgroundGlintParticle.curvePow = 0.8;
					Crumbs.spawnParticle(decay.veilBackgroundGlintParticle, Math.random() * Crumbs.scopedCanvas.foreground.l.offsetWidth, Math.random() * Crumbs.scopedCanvas.foreground.l.offsetHeight, Math.random() * Math.PI, 1, 'foreground'); 
				}
				decay.veilBackgroundGlintParticle.curvePow = 0.5;
			});

			this.createHeavenlyUpgrade('Mangled cookies', 'Wrinklers approach the big cookie <b>5%</b> slower.<br>You deal <b>5%</b> more damage to wrinklers.<q>Whatever happened to this big cookie mustn\'ve been pleasant...</q>', 1e6, [23, 1, kaizoCookies.images.custImg], ['Wrinkly cookies'], -417, -997, 253.5);
			this.createHeavenlyUpgrade('Eternal light', 'The wrinkler stun effect on damage is <b>twice</b> as potent.<q>Actions disrupting the wrinklers\' concentration is now much more impactful in producing confusion.</q>', 2e6, [25, 1, kaizoCookies.images.custImg], ['Mangled cookies'], -565, -1029, 253.6);
			this.createHeavenlyUpgrade('Ancient shiny busters', 'Each grandma (up to 800) increases damage against shiny wrinklers by <b><span>0.<span>0</span>5</span>%</b>.<q>What was their name again...? G...rand...?</q>', 1e9, [2, 2, kaizoCookies.images.custImg], ['Sugar aging process'], -242, -1389, 253.7);

			this.createHeavenlyUpgrade('Mana-enhanced magic', 'Magic regeneration in the Grimoire is <b>2 times</b> faster.<q>Mana is an arcane energy from the heavens, greatly boosting your magic regeneration.</q>', 69, [17, 27], ['Heralds'], -420, -130, 289.5);
			Game.Upgrades['Wrapping paper'].posX = 464; 
			Game.Upgrades['Wrapping paper'].posY = -482;
			Game.Upgrades['Wrapping paper'].parents = [Game.Upgrades['Archangels']];

			this.createHeavenlyUpgrade('Sugar burning', 'Unlocks the <b>Glucose furnace</b>, converting sugar lumps into permanent increasing CpS bonuses in a run.<q>Aerosolized sugar makes for great passive energy intake!</q>', 1.4e6, [25, 3, kaizoCookies.images.custImg], ['Wrinkly cookies'], -88, -980, 253.8);
			Game.last.buyFunction = function() {
				decay.adjustFurnaceUpgradeStatus();
			}

			this.createHeavenlyUpgrade('Pulsatic discharge', 'The thunder marker now releases a small damaging shockwave once every 20 seconds.<br>The thunder marker shockwave multiplier is increased to <b>250%</b>.<br>Is a prerequisite to a glucose furnace boost cap upgrade.<q>Makes you wonder why it didn\'t do that before.</q>', 1.2e8, [25, 6, kaizoCookies.images.custImg], ['Thunder marker'], -625, -820, 272.01);
			decay.furnaceCapUpgradeReqs[3].text = loc('heavenly upgrade %1', '<span class="highlightHover underlined" ' + decay.getUpgradeTooltipCSS('Pulsatic discharge') + '>' + Game.Upgrades['Pulsatic discharge']?.dname + '</span>');

			this.achievements.push(new Game.Upgrade('Rebound boost', 'Upon recovering from exhaustion, your most advanced building produces <b>4x</b> as much for <b>30 seconds</b>.<q>Energy renewed, giving your buildings a nice shine.</q>', 1e12, [25, 8, kaizoCookies.images.custImg]));
			addLoc('Production of most advanced building +%1%!');
			new Game.buffType('reboundBoost', function(time) {
				return {
					name: 'Rebound boost',
					desc: loc('Production of most advanced building +%1%!', Beautify(300)),
					time: time*Game.fps,
					add: true,
                	icon: [25, 8, kaizoCookies.images.custImg],
                	aura: 1
				}
			});
			Game.last.order = 100000; 
			this.achievements.push(new Game.Upgrade('Counter strike', 'Upon recovering from exhaustion, your clicks deal <b>+75%</b> damage to wrinklers for <b>30 seconds</b>.<q>PAT PAT PAT SQUISH</q>', 5e12, [25, 9, kaizoCookies.images.custImg]));
			addLoc('Click damage against wrinklers +%1%!');
			new Game.buffType('counterStrike', function(time) {
				return {
					name: 'Counter strike',
					desc: loc('Click damage against wrinklers +%1%!', Beautify(75)),
					time: time*Game.fps,
					add: true,
					icon: [25, 9, kaizoCookies.images.custImg],
					aura: 1
				}
			})
			Game.last.order = 100001;
			this.achievements.push(new Game.Upgrade('Withering shock', 'Upon recovering from exhaustion, all wrinklers on-screen permanently take <b>x1.5</b> damage from all sources (stackable).<q>Half-tautological, half-technological, it siphons off your mental wellbeing to create powerful bursts of electricity, permanently shocking and weakening the armor of wrinklers.</q>', 2e19, [25, 10, kaizoCookies.images.custImg]));
			Game.last.order = 100002;
			addLoc('wrinkler damage x%1!');
			//challenge to abuse this perhaps? boost its effects to x1.4, have players spam exh (in challenge clicks dec exh time, wrinkler speed dec but massive hp boost), reward is that the x1.4 is always a thing
			this.achievements.push(new Game.Upgrade('Back in a flash', 'Upon recovering from exhaustion, the thunder marker releases <b>two large shockwaves</b>.<q>Back so fast, like the flash!</q>', 2e33, [25, 11, kaizoCookies.images.custImg]));
			Game.last.order = 100003;

			this.createHeavenlyUpgrade('Box of kittens', 'Contains a variety of new kittens.<q>Cat distribution Ltd. presents: 3-in-one kitten package! (shipping not included)</q>', 9e6, [25, 7, kaizoCookies.images.custImg], ['Kitten angels'], 621, -804, 327);
			this.achievements.push(new Game.Upgrade('Confused kitten', 'You gain <b>more milk</b> the more CpS you have.<q>No, no... he\'s got a point</q>', 1e30, [25, 13, kaizoCookies.images.custImg]));
			Game.last.order = 20005;
			this.achievements.push(new Game.Upgrade('Tiny kitten', 'You gain <b>a bit more CpS</b> the more milk you have.<q>It ain\'t much, but it\'s honest work.</q>', 1e39, [25, 14, kaizoCookies.images.custImg]));
			Game.last.order = 20006;
			this.achievements.push(new Game.Upgrade('Negative kitten', '<b>CpS +200%</b>. You gain <b>less CpS</b> the less milk you have.<q>you help I may meow</q>', 1e45, [25, 12, kaizoCookies.images.custImg]));
			Game.last.order = 20007;
			eval('Game.CalculateGains='+Game.CalculateGains.toString()
				.replace("milkMult*=Game.eff('milk');", "if (Game.Has('Confused kitten')) { Game.milkProgress += Math.round(Game.log10Cookies * 2) / 25; } milkMult*=Game.eff('milk');")
				.replace(`Game.cookiesMultByType['kittens']=catMult;`, `if (Game.Has('Tiny kitten')) catMult*=(1+Game.milkProgress*0.025*milkMult); \n if (Game.Has('Negative kitten')) { catMult*=(1 + 2 / (1 + Math.max(32 - Game.milkProgress) / 4)); } \nGame.cookiesMultByType['kittens']=catMult;`)
			);

			addLoc('Souls pulled: %1');
			addLoc('Phantom tethers activated!')
			new decay.scroll('Scroll of phantom tethers', 'Type "getin" to pull in <b>all wrinkler souls</b> present on screen into the big cookie!', 1e7, [26, 1, kaizoCookies.images.custImg], ['Scroll of no escape'], 308, 906, 'getin', 2 * 60, function() { let arr = Crumbs.getObjects('s'); if (!arr.length) { Game.Notify(loc('No souls to pull!'), '', 0, 2); return true; } Game.Notify(loc('Phantom tethers activated!'), loc('Souls pulled: %1', arr.length), [15, 3, kaizoCookies.images.custImg]); Crumbs.spawn(decay.noEscapeObjectTemplate, { soulList: arr }); Game.gainBuff('reverseMomentum', 5); });
			decay.noEscapeObjBehavior = new Crumbs.behavior(function() {
				if (!this.soulList.length) { this.die(); return; }
				//more logic here 
				const call = Math.floor(Math.pow(Math.max(Crumbs.t - this.t - 0.25 * Game.fps, 0), 1.8) / (Game.fps * 5));
				if (call <= this.lastTrigger) { return; }

				this.lastTrigger = call;

				const centerX = this.scope.l.width * 0.5;
				const centerY = this.scope.l.height * 0.4;
				let soul = this.soulList.splice(this.soulList[Math.floor(Math.random() * this.soulList.length)], 1)[0];
				Crumbs.spawnVisible(decay.soulClaimAuraTemplate, {
					behaviors: decay.soulClaimAuraBehaviorPure,
					x: soul.x,
					y: soul.y,
					scope: 'left',
					color: soul.shiny?'#fdff7f':'#b6e4ff',
					currentSize: Crumbs.getPWidth(soul) / 2,
					currentWidth: 3 * soul.scaleX,
					expandSpeed: (100 + (soul.shiny?50:0)) / Game.fps,
					thinningSpeed: 0.2 / Game.fps,
					expandFriction: 0.85 + (soul.shiny?0.05:0),
					thinningAcceleration: (0.4 - (soul.shiny?0.2:0)) / Game.fps
				});
				soul.behaviors[0].dx = (centerX - soul.x) * 0.15 * (1 / 0.05);
				soul.behaviors[0].dy = -(centerY - soul.y) * 0.15;
				//soul.behaviors[0].dyy = 0;
			});
			decay.noEscapeObjectTemplate = {
				scope: 'left',
				soulList: [],
				lastTrigger: 0,
				behaviors: new Crumbs.behaviorInstance(decay.noEscapeObjBehavior)
			}

			this.createHeavenlyUpgrade('Voyager', 'You start non-unshackled decay runs with <b>1 free shipment</b>.<q>Your very first expedition to the unknown, immortalized.</q>', 2.2e9, [25, 16, kaizoCookies.images.custImg], ['Keepsakes'], -1056, -326, Game.Upgrades['Keepsakes'].order + 0.001);
			this.createHeavenlyUpgrade('Your first idea', 'You keep the first <b>eight</b> cortex baker upgrades across ascensions.<q>This would sound really dumb, but what if...</q>', 6.6e9, [26, 17, kaizoCookies.images.custImg], ['Voyager'], -1222, -248, Game.Upgrades['Keepsakes'].order + 0.002);

			new decay.scroll('Scroll of charged clicks', 'Type "zzz" to have big cookie clicks halt decay and builds up fatigue <b>3 times</b> faster for <b>3 seconds</b>.', 4e8, [28, 3, kaizoCookies.images.custImg], ['Scroll of prestige unbound'], 820, 1000, 'zzz', 45, function() { Game.gainBuff('enhancedClicks', 3); });
			addLoc('Enhanced clicks');
			addLoc('Clicks halt decay and build up fatigue %1x faster for %2');
			new Game.buffType('enhancedClicks', function(time) {
				return {
					name: loc('Enhanced clicks'),
					desc: loc('Clicks halt decay and build up fatigue %1x faster for %2', [3, Game.sayTime(time * Game.fps)]),
					icon: [0, 31],
					time: time * Game.fps
				}
			});

			this.createHeavenlyUpgrade('Polar power', 'You keep all <b>polargurt-tiered</b> upgrades across ascensions.<q>The rememberance of the spectrum.</q>', 9.9e9, [9, 12, kaizoCookies.images.custImg], ['Your first idea'], -1322, -116, Game.Upgrades['Keepsakes'].order + 0.003);
			this.createHeavenlyUpgrade('The autobiography', 'You permanently keep <b>1%</b> of your big cookie clicks performed in a run upon ascension.<q>Welcome back.</q>', 9.9e10, [0, 0 /* placeholder */], ['Polar power'], -1272, 34, Game.Upgrades['Keepsakes'].order + 0.004);
			decay.keptClicks = false;
			decay.clicksKept = 0; //so that you cant ascend animation cancel spam

			this.upgrades = []; //:ortroll:

			decay.purityAchievsReqMap = [];
			decay.purityAchievs = [];
			this.createPurityAchiev = function(name, buildId, iconId, flavor) {
				decay.purityAchievsReqMap.push(1 + (0.5 + 0.1 * buildId + 0.5) * (1 + buildId) / 2);
				decay.purityAchievs.push(new Game.Achievement(name, 'Obtain a CpS multiplier from purity of <b>+'+((50 + 10 * buildId + 50) * (1 + buildId) / 2)+'%</b> or more for at least <b>5 seconds</b>.'+(flavor?'<q>'+flavor+'</q>':''), [iconId, 4, kaizoCookies.images.custImg]));
				decay.purityAchievs[decay.purityAchievs.length - 1].order = 8000 + buildId / 100;
				return decay.purityAchievs[decay.purityAchievs.length - 1];
			}
			this.upgrades = this.upgrades.concat([
				this.createPurityAchiev('You gotta start somewhere', 0, 0),
				this.createPurityAchiev('+110% purity is a lot', 1, 1),
				this.createPurityAchiev('Half life 1.8 CONFIRMED', 2, 2),
				this.createPurityAchiev('P4M: Purified 4 Mines', 3, 3),
				this.createPurityAchiev('5-dimensional Purification Punch', 4, 4),
				this.createPurityAchiev('We couldn\'t afford a 4.5', 5, 15),
				this.createPurityAchiev('Not a luck-related achievement', 6, 16),
				this.createPurityAchiev('90 degrees to NaN', 7, 17, 'Relatable.'),
				this.createPurityAchiev('To a better world', 8, 5, 'Use Sunfall!'),
				this.createPurityAchiev('Consistency obtained', 9, 6),
				this.createPurityAchiev('Gravity of the situation', 10, 7),
				this.createPurityAchiev('The old days were better', 11, 8),
				this.createPurityAchiev('Pretty close to infinity', 12, 13, 'Oh, the AD references? Thought you were talking about the first 8?'),
				this.createPurityAchiev('As bright as a hypernova', 13, 14),
				this.createPurityAchiev('Pure skill', 14, 19, 'Not a luck-related achievement?'),
				this.createPurityAchiev('In filtration', 15, 20),
				this.createPurityAchiev('var decay = undefined', 16, 21),
				this.createPurityAchiev('Third-universe idleverses', 17, 22, 'Does that make me a bad person?'),
				this.createPurityAchiev('Innocence', 18, 23),
				this.createPurityAchiev('Self remade', 19, 24)
			]);
			decay.checkPurityUpgrades = function() { //ultra troll
				if (Game.T % (Game.fps / 3) == 0) {
					if (decay.multList.length < 25) { return; }
					for (let i in decay.purityAchievsReqMap) {
						if (decay.checkAboveCertainPurityHold(decay.purityAchievsReqMap[i])) { Game.Win(decay.purityAchievs[i].name); } else { break; }
					}
				}
				if (Game.Has('Purity key') && decay.purityKeyState == 1 && decay.checkAboveCertainPurityHold(11)) { 
					decay.purityKeyState = 2; 
					Game.Notify(loc('Purity key charged!'), '', 0, 20, true, true);
				}
				if (decay.gen >= 101) {
					Game.Win('Weak grail material');
				}
			};
			decay.checkAboveCertainPurityHold = function(threshold) {
				let win = true;
				for (let ii = 0; ii < 50; ii++) {
					if (decay.multList[ii] < threshold) {
						win = false; break;
					}
				}
				return win; 
			}
			Game.registerHook('logic', decay.checkPurityUpgrades);
			this.upgrades.push(new Game.Achievement('Weak grail material', 'Obtain a CpS multiplier from purity of <b>+10,000%</b> or higher.<q>As the mysterious developer walked onto the stage, surrounded by distraught and hopeless fans, he said, in the most gentle of all voices: "The players will find a way. They will."<br>And thus the crowd quieted down, relieved by the antidote of hope.</q>', [0, 2, kaizoCookies.images.custImg]));
			Game.Achievements['Weak grail material'].order = 70000; Game.Achievements['Weak grail material'].pool = 'shadow';
			//let willPurifyDecayStr = '<div class="line"></div>Obtaining this achievement <b>purifies all of your decay</b>.';
			let willPurifyDecayStr = '';
			this.upgrades.push(new Game.Achievement('Morale boost', 'Obtain a CpS multiplier from decay of <b>-50%</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Morale boost'].order = 7500.1;
			this.upgrades.push(new Game.Achievement('Glimmering hope', 'Obtain a CpS multiplier from decay of <b>-99%</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Glimmering hope'].order = 7500.2;
			this.upgrades.push(new Game.Achievement('Saving grace', 'Obtain a CpS multiplier from decay of <b>-99.99%</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Saving grace'].order = 7500.3;
			this.upgrades.push(new Game.Achievement('Last chance', 'Obtain a CpS multiplier from decay of <b>1 / 1 quinquinquagintillion</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Last chance'].order = 7500.4;
			this.upgrades.push(new Game.Achievement('Ultimate death', 'Reach <b>infinite decay</b>.<div class="line"></div>Obtaining this achievement purifies <b>all</b> of your decay.<q>Almost as bad as ascending at 1.</q>', [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Ultimate death'].order = 8080;
			this.upgrades.push(new Game.Achievement('Magmaball effect', 'Reach a decay rates multiplier of at least <b>x3</b> from your momentum.<q>The snowball effect, but bad.</q>', [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Magmaball effect'].order = 7510.1;
			this.upgrades.push(new Game.Achievement('Fast (but you wish it wasn\'t)', 'Reach a decay rates multiplier of at least <b>x6</b> from your momentum.<q>Another one of those at x12!</q>', [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Fast (but you wish it wasn\'t)'].order = 7510.2;
			this.upgrades.push(new Game.Achievement('Unstoppable', 'Reach a decay rates multiplier of at least <b>x12</b> from your momentum.<q>Did you do it via the hard way, or the smart way?</q>', [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Unstoppable'].order = 7510.3;
			this.upgrades.push(new Game.Achievement('Calcium overflow', 'Reach a kitten multiplier of at least +123 trillion% whilst having a CpS multiplier from purity of at least +1234%. ', [11, 4, kaizoCookies.images.custImg])); Game.Achievements['Calcium overflow'].order = 10001;

			this.upgrades.push(new Game.Achievement('First contact', 'Complete a challenge.', [12, 6])); Game.Achievements['First contact'].order = 31000;
			this.upgrades.push(new Game.Achievement('Better, faster, stronger', 'Complete <b>5</b> challenges.', [13, 6])); Game.Achievements['Better, faster, stronger'].order = 31001;
			this.upgrades.push(new Game.Achievement('The olympiad', 'Complete <b>15</b> challenges.', [14, 6])); Game.Achievements['The olympiad'].order = 31002;
			this.upgrades.push(new Game.Achievement('Godhood', 'Complete <b>every</b> challenge.', [14, 6])); Game.Achievements['Godhood'].order = 31100;
			this.upgrades.push(new Game.Achievement('Getting a taste of what\'s to come', 'Complete <b>every</b> challenge from the <b>vial of challenges</b>.', [11, 14, kaizoCookies.images.custImg])); Game.Achievements['Getting a taste of what\'s to come'].order = 31010;
			this.upgrades.push(new Game.Achievement('All boxed up', 'Complete <b>every</b> challenge from the <b>box of challenges</b>.', [12, 14, kaizoCookies.images.custImg])); Game.Achievements['All boxed up'].order = 31011;
			this.upgrades.push(new Game.Achievement('Esoteric world traveler', 'Complete <b>every</b> challenge from the <b>truck of challenges</b>.', [13, 14, kaizoCookies.images.custImg])); Game.Achievements['Esoteric world traveler'].order = 31012;
			this.upgrades.push(new Game.Achievement('Practice makes perfect', 'Complete a repeatable challenge at least <b>3</b> times.', [15, 14, kaizoCookies.images.custImg])); Game.Achievements['Practice makes perfect'].order = 31020;
			this.upgrades.push(new Game.Achievement('Total mastery', 'Complete a repeatable challenge at least <b>6</b> times.', [16, 14, kaizoCookies.images.custImg])); Game.Achievements['Total mastery'].order = 31021;

			this.upgrades.push(new Game.Achievement('Corrupted and tainted', 'Ascend with a purity of at least <b>+2,000%</b>.', [20, 2, kaizoCookies.images.custImg])); Game.Achievements['Corrupted and tainted'].order = 30550;

			this.upgrades.push(new Game.Achievement('A light reward', 'Claim your first <b>shiny wrinkler soul</b>, unlocking the <b>Utenglobe</b>.', [12, 2, kaizoCookies.images.custImg])); Game.Achievements['A light reward'].order = 9920;

			this.upgrades.push(new Game.Achievement('Extracts of the cursed', 'Claim your first <b>wrinkler soul</b>.', [12, 3, kaizoCookies.images.custImg])); Game.Achievements['Extracts of the cursed'].order = 9900;
			this.upgrades.push(new Game.Achievement('Energy of the unseen', 'Claim <b>10</b> wrinkler souls.', [13, 3, kaizoCookies.images.custImg])); Game.Achievements['Energy of the unseen'].order = 9900.1;
			this.upgrades.push(new Game.Achievement('Humanity of the impure', 'Claim <b>100</b> wrinkler souls.', [14, 3, kaizoCookies.images.custImg])); Game.Achievements['Humanity of the impure'].order = 9900.2;
			this.upgrades.push(new Game.Achievement('Possibility of the bonded', 'Claim <b>1,000</b> wrinkler souls.', [9, 3, kaizoCookies.images.custImg])); Game.Achievements['Possibility of the bonded'].order = 9900.3;
			this.upgrades.push(new Game.Achievement('Finality of the unrest', 'Claim <b>10,000</b> wrinkler souls.', [9, 3, kaizoCookies.images.custImg])); Game.Achievements['Finality of the unrest'].order = 9900.4;
			this.upgrades.push(new Game.Achievement('A new era of purity', '<b>Maintain purity</b> by claiming a wrinkler soul while also halting decay with clicking.', [9, 3, kaizoCookies.images.custImg])); Game.Achievements['A new era of purity'].order = 9910;

			this.upgrades.push(new Game.Achievement('Suffering in nobility', 'Claim <b>10</b> shiny wrinkler souls.', [13, 2, kaizoCookies.images.custImg])); Game.Achievements['Suffering in nobility'].order = 9920.1;
			this.upgrades.push(new Game.Achievement('Golden escalation', 'Claim <b>100</b> shiny wrinkler souls.', [14, 2, kaizoCookies.images.custImg])); Game.Achievements['Golden escalation'].order = 9920.2;
			this.upgrades.push(new Game.Achievement('Greatness unfolding over millenia, without a reason, without an end', 'Claim <b>1,000</b> shiny wrinkler souls.', [10, 3, kaizoCookies.images.custImg])); Game.Achievements['Greatness unfolding over millenia, without a reason, without an end'].order = 9920.3;

			this.upgrades.push(new Game.Achievement('Undead terrorism', 'Pop your first <b>bomber wrinkler</b>.', [13, 1, kaizoCookies.images.custImg])); Game.Achievements['Undead terrorism'].order = 21000.263;
			this.upgrades.push(new Game.Achievement('Way to soulflow', 'Distort yourself by letting a bomber wrinkler explode.<q>To attract the attention of weak bombers, you say? Poor, poor bombers... in a place during a time they were never meant to be.</q>', [14, 1, kaizoCookies.images.custImg])); Game.Achievements['Way to soulflow'].order = 21000.264;

			this.upgrades.push(new Game.Achievement('Mass x velocity', 'Unlock <b>decay momentum</b>.'+willPurifyDecayStr, [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Mass x velocity'].order = 7509;
			this.upgrades.push(new Game.Achievement('Unnatural resistance', 'Unlock <b>decay</b>.', [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Unnatural resistance'].order = 7499;

			this.upgrades.push(new Game.Achievement('Speed baking IV', loc("Get to <b>%1</b> baked in <b>%2</b>.",[loc("%1 cookie",LBeautify(1e8)),Game.sayTime(3*Game.fps)]),[12, 0, kaizoCookies.images.custImg])); Game.Achievements['Speed baking IV'].order = 11020;

			this.upgrades.push(new Game.Achievement('Fleshmangler', loc("Burst <b>%1 wrinklers</b>.", Beautify(500)), [19, 8])); Game.Achievements['Fleshmangler'].order = 21000.108;
			this.upgrades.push(new Game.Achievement('Horrorsubduer', loc("Burst <b>%1 wrinklers</b>.", Beautify(1000)), [19, 8])); Game.Achievements['Horrorsubduer'].order = 21000.109;

			addLoc('Burst <b>%1</b> bomber wrinklers.');
			this.upgrades.push(new Game.Achievement('The red wire', loc('Burst <b>%1</b> bomber wrinklers.', Beautify(66)), [13, 1, kaizoCookies.images.custImg])); Game.Achievements['The red wire'].order = 21000.2631;
			this.upgrades.push(new Game.Achievement('Innocence farmer', loc('Burst <b>%1</b> bomber wrinklers.', Beautify(6666)), [13, 1, kaizoCookies.images.custImg])); Game.Achievements['Innocence farmer'].order = 21000.2632;

			this.upgrades.push(new Game.Achievement('Mass reindeer duplication', 'Trigger a <b>Reindeer frenzy</b>.', [21, 2, kaizoCookies.images.custImg])); Game.Achievements['Mass reindeer duplication'].order = 22200;

			this.checkChallengeAchievs = function() {
				const completions = decay.challengesCompleted;
				if (completions>=1) { Game.Win('First contact'); }
				if (completions>=5) { Game.Win('Better, faster, stronger'); }
				if (completions>=15) { Game.Win('The olympiad'); }
				if (completions==decay.totalChallenges) { Game.Win('Godhood'); }
				let bool = true;
				for (let i in decay.challengeCategories.vial) {
					if (!decay.challengeCategories.vial[i].complete) { bool = false; break; }
				}
				if (bool) { Game.Win('Getting a taste of what\'s to come'); }
				bool = true;
				for (let i in decay.challengeCategories.box) {
					if (!decay.challengeCategories.box[i].complete) { bool = false; break; }
				}
				if (bool) { Game.Win('All boxed up'); }
				bool = true;
				for (let i in decay.challengeCategories.truck) {
					if (!decay.challengeCategories.truck[i].complete) { bool = false; break; }
				}
				if (bool) { Game.Win('Esoteric world traveler'); }
				for (let i in decay.repeatableChallenges) {
					if (decay.repeatableChallenges[i].complete >= 3) { Game.Win('Practice makes perfect'); }
					if (decay.repeatableChallenges[i].compelte >= 6) { Game.Win('Total mastery'); }
				}
			}

			decay.alwaysPermaslottables = ['Lucky day', 'Serendipity', 'Get lucky', 'Santa\'s dominion', 'Memory capsule', 'Sacrificial rolling pins', 'Chance encounter', 'Fortune #100', 'Fortune #101', 'Fortune #102', 'Fortune #103', 'Fortune #104', ...Game.rareEggDrops, 'A golden hat', 'Withering shock'];
			decay.setAlwaysPermaslottables();
			
			LocalizeUpgradesAndAchievs();

			Game.Upgrades['Twin Gates of Transcendence'].dname=loc("Power clicks");
			for (let i in Game.santaDrops) {
				Game.Upgrades[Game.santaDrops[i]].ddesc = Game.Upgrades[Game.santaDrops[i]].desc;
			}

			decay.checkChallengeUnlocks();

			/*Object.defineProperty(Game.Upgrades['Muscle relaxant'], 'bought', {
				get: () => { return this._unlocked; },
				set: (value) => { this._unlocked = value; console.trace(); }
			});*/

			allValues('achievements and upgrades created');
		}
		this.getThisModAchievs = function() {
			let n = 0;
			for (let i in Game.Achievements) {
				if (Game.Achievements[i].vanilla && Game.Achievements[i].pool == 'normal') { n++; }
			}
			for (let i in this.upgrades) {
				if (this.upgrades[i].pool == 'normal') { n++; }
			}
			return n;
		}
		this.checkAchievements=function(){//Adding the unlock condition
			if (Game.cookiesEarned>=1000000000) { Game.Unlock('Golden sugar'); }
			if (Game.cookiesEarned>=1000000000000000) { Game.Unlock('Caramelized luxury'); }
			if (Game.AchievementsOwned>=400) { Game.Unlock('Meaty disgust'); }
			if (Game.AchievementsOwned>=500) { Game.Unlock('High-fructose sugar lumps'); }
			if (Game.HasAchiev('Sugar sugar') && Game.cookiesEarned >= Game.Upgrades['Rainy day lumps'].basePrice) { Game.Unlock('Rainy day lumps'); }

			if (Game.Has('Cursedor')) { Game.Unlock('Cursedor [inactive]'); }
			
			if (Game.AchievementsOwned>=kaizoCookies.getThisModAchievs()) { Game.Unlock('The ultimate cookie'); }

			if (decay.unlocked) { Game.Unlock('Decayed cookie'); }

			if (Game.Has('Kitten strategists') && Game.HasAchiev('Self remade')) { Game.Unlock('Kitten janitors'); }

			for (let i in decay.offBrandFingers) {
				if (Game.cookiesEarned > decay.offBrandFingers[i].basePrice) { Game.Unlock(decay.offBrandFingers[i].name); }
			}
			for (let i in decay.multiFingers) {
				if (Game.cookiesEarned > decay.multiFingers[i].basePrice) { Game.Unlock(decay.multiFingers[i].name); }
			}

			if (Game.Has('Bakery')) { Game.Unlock('Cookie selector'); }

			if (Game.Has('Season switcher')) { 
				if (Game.cookiesEarned > Game.Upgrades['Santaic doom'].basePrice) { Game.Unlock('Santaic doom'); }
				if (Game.cookiesEarned > Game.Upgrades['Santaic zoom'].basePrice) { Game.Unlock('Santaic zoom'); }
			} 

			if (Game.Objects['Cursor'].amount > 0) {
				const mult = (Game.resets>0?1:2) * (Game.Has('Phantom clicks')?0.5:1);
				const c = Game.cookieClicks + decay.clicksKept;
				if (c > 100 * mult) { Game.Unlock('Muscle relaxant'); }
				if (c > 300 * mult) { Game.Unlock('Trigger fingers'); }
				if (c > 500 * mult) { Game.Unlock('Non-euclidean baking trays'); }
			}

			if (Game.wrinklersPopped >= 50 && Game.cookiesEarned >= Game.Upgrades['Molten piercer'].basePrice) {
				Game.Unlock('Molten piercer');
			}

			if (Game.cookiesEarned > 2e10) { Game.Unlock('Blessed monuments'); }
			if (Game.cookiesEarned > 3e11) { Game.Unlock('Paint of proof'); }
			if (Game.cookiesEarned > 4e12) { Game.Unlock('Integrated alloys'); }

			if (Game.Has('Purification domes') && Game.HasAchiev('Self remade')) { Game.Unlock('Touch of nature'); }

			if (Game.santaLevel > 12) { Game.Unlock('A golden hat'); }

			if (decay.timesExhausted > 0) { Game.Unlock('Rebound boost'); }
			if (decay.timesExhausted > 1) { Game.Unlock('Counter strike'); }
			if (decay.timesExhausted > 4 && Game.cookiesEarned > Game.Upgrades['Withering shock'].basePrice) { Game.Unlock('Withering shock'); }
			if (decay.timesExhausted > 10 && Game.Has('Thunder marker') && Game.cookiesEarned > Game.Upgrades['Back in a flash'].basePrice) { Game.Unlock('Back in a flash'); }

			if (Game.cookiesEarned > Game.Upgrades['Soul compression'].basePrice) { Game.Unlock('Soul compression'); }
			if (Game.cookiesEarned > Game.Upgrades['Weightlessness'].basePrice) { Game.Unlock('Weightlessness'); }

			if (Game.Has('Box of kittens')) {
				if (Game.cookiesEarned > Game.Upgrades['Confused kitten'].basePrice) { Game.Unlock('Confused kitten'); }
				if (Game.cookiesEarned > Game.Upgrades['Tiny kitten'].basePrice) { Game.Unlock('Tiny kitten'); }
				if (Game.cookiesEarned > Game.Upgrades['Negative kitten'].basePrice) { Game.Unlock('Negative kitten'); }
			}

			kaizoCookies.toCheckBuildingAchievements = 1;
		}
		this.checkBuildingAchievements = function() {
			kaizoCookies.checkPolargurt();
			kaizoCookies.checkRhodorange();
			kaizoCookies.checkEldersite();
			kaizoCookies.checkMalachilla();
		}
		this.toCheckBuildingAchievements = 0;
		Game.registerHook('logic', function() { if (kaizoCookies.toCheckBuildingAchievements) { kaizoCookies.checkBuildingAchievements(); kaizoCookies.toCheckBuildingAchievements = 0; }});
		if(Game.ready) this.createAchievements()
		else Game.registerHook("create", this.createAchievements)
		Game.registerHook("check", this.checkAchievements)

		this.checkUpgrades = function() {
			if (!decay.unlocked) { return; }
			if (decay.gen < 0.5) { Game.Win('Morale boost'); } 
			if (decay.gen < 0.01) { Game.Win('Glimmering hope'); }
			if (decay.gen < 0.0001) { Game.Win('Saving grace'); }
			var m = decay.TSMultFromMomentum;
			if (decay.gen < 1e-168) { Game.Win('Last chance'); }
			if (m >= 3) { Game.Win('Magmaball effect'); }
			if (m >= 6) { Game.Win('Fast (but you wish it wasn\'t)'); }
			if (m >= 12) { Game.Win('Unstoppable'); }

			if (decay.wrinklersN >= 52) { Game.Win('Wrinkler poker'); }

			if (decay.gen >= 13.34 && Game.cookiesMultByType['kittens'] >= 1.23e+12) { Game.Win('Calcium overflow'); }

			if (Game.wrinklersPopped >= 500) { Game.Win('Fleshmangler'); }
			if (Game.wrinklersPopped >= 1000) { Game.Win('Horrorsubduer'); }

			if (decay.bombersPopped >= 66) { Game.Win('The red wire'); }
			if (decay.bombersPopped >= 6666) { Game.Win('Innocence farmer'); }
		}
		Game.registerHook('check', this.checkUpgrades);

		Game.Upgrades['Wrinkler ambergris'].lasting=true;
		decay.unskippableUpgrades.push(Game.Upgrades['Wrinkler ambergris']);
		Game.Achievements['Last Chance to See'].dname = 'First Chance to Suffer'; 
		Game.Achievements["Last Chance to See"].name='First Chance to Suffer';

		Game.EarnSelectedEnchantedPermanentUpgrade=function()
		{
			if (Game.ascensionMode != 1) {
				for (let i in Game.EnchantedPermanentUpgrades)
				{
					if (Game.EnchantedPermanentUpgrades[i]!=-1)
					{Game.UpgradesById[Game.EnchantedPermanentUpgrades[i]].earn();}
				}
			}
		}
		

		Game.registerHook('reset', Game.EarnSelectedEnchantedPermanentUpgrade);

		Game.registerHook('check', this.checkUpgrades);

		decay.CursedorUses = 0;

		//first number: absolute minimum clicks for that effect to spawn; seoncd number: the mult to click amount needed to gain another entry in the pool
		decay.cursedorThresholdMap = {
			'click frenzy': [60000, 2.5],
			'cursed finger': [5000, 300],
			'blood frenzy': [66666, 6],
			'sugar frenzy': [10000, 10],
			'sugar blessing': [10000, 3],
			'building special': [100000, 5],
			'cookie storm drop': [150, 15],
			'blab': [2500000, 1.05],
			'cookie storm': [10000, 8],
			'clot': [6666, 6],
			'ruin': [6666, 6],
			'everything must go': [200, 25],
			'Nasty goblins': [1000, 1000],
			'Haggler\'s misery': [1000, 1000],
			'Crafty pixies': [2500, 250],
			'Haggler\'s luck': [2500, 250],
			'free sugar lump': [200000, 1.5],
			'dragon harvest': [300000, 2.5],
			'dragonflight': [111111, 11],
			'frenzy': [7500, 7.5],
			'multiply cookies': [7500, 7.5],
			'failure': [100000, 2000]
		}
		decay.getCursedorEffAdd = function(eff, clicks) {
			if (clicks < decay.cursedorThresholdMap[eff][0]) { return 0; }
			return randomFloor(Math.log(clicks / decay.cursedorThresholdMap[eff][0]) / Math.log(decay.cursedorThresholdMap[eff][1]));
		}
		Game.registerHook('click',function() {
			if (Game.Has("Cursedor [inactive]")) {
                decay.CursedorUses++;
				Math.seedrandom(Game.seed + '/' + decay.CursedorUses);
				let pool = [];

				let clicks = Game.cookieClicks;
				clicks *= 5; //must preserve 66666

				for (let i in decay.cursedorThresholdMap) {
					for (let ii = 0; ii < decay.getCursedorEffAdd(i, clicks); ii++) {
						pool.push(i);
					}
				}
				let toforce = 'failure';
				if (pool.length > 0) { 
					toforce = choose(pool);
				}
				if (toforce == 'building special' && Game.BuildingsOwned<10) { toforce = 'failure'; }
				if (toforce == 'click frenzy' && Game.hasBuff('Dragonflight')) { toforce = 'failure'; }
				if (toforce != 'failure') { let newShimmer = new Game.shimmer('golden'); newShimmer.force = toforce; Game.Popup('<div style="font-size:80%;">'+loc("Successful click! Click count reset.")+'</div>',Game.mouseX,Game.mouseY); } else {
					Game.Popup('<div style="font-size:80%;">'+loc("Failed due to not enough clicks! Click count reset.")+'</div>',Game.mouseX,Game.mouseY);
				}
				Game.cookieClicks=0;
				Math.seedrandom();
			}
		});

		Game.registerHook('draw', decay.draw); //removing the east wall to fill the west wall
		decay.setRates();
		if (Game.ready) { Game.compileLowerCasedUpgrades(); Game.compiledLowercasedDragonAuras(); } else { Game.registerHook('create', function() { Game.compileLowerCasedUpgrades(); Game.compiledLowercasedDragonAuras(); }); }

		decay.markPrereqs();

		this.reworkMinigames = function() {
			if (Game.Objects['Wizard tower'].minigameLoaded) { this.reworkGrimoire(); } else { let h = setInterval(() => { kaizoCookies.reworkGrimoire(); if (grimoireUpdated) { clearInterval(h); } }, 10); }
			if (Game.Objects['Farm'].minigameLoaded) { this.reworkGarden(); } else { let h = setInterval(() => { kaizoCookies.reworkGarden(); if (gardenUpdated) { clearInterval(h); } }, 10); }
			if (Game.Objects['Temple'].minigameLoaded) { this.reworkPantheon(); } else { let h = setInterval(() => { kaizoCookies.reworkPantheon(); if (pantheonUpdated) { clearInterval(h); } }, 10); }
			if (Game.Objects['Bank'].minigameLoaded) { this.reworkStock(); } else { let h = setInterval(() => { kaizoCookies.reworkStock(); if (stockUpdated) { clearInterval(h); } }, 10); }
		}
		this.reworkMinigames();
		Game.rebuildAuraCosts();
		decay.checkCovenantModeUnlocks();
		decay.recalcAccStats();
		Game.prestige = Game.HowMuchPrestige(Game.cookiesReset);
		Game.normalAchievsN = Game.getNormalAchievsN();
		decay.notifsLoaded = true;
		let allStyles = document.createElement('style');
		allStyles.textContent = cssList;
		cssList = '';
		l('game').appendChild(allStyles);

		for (let i in Game.BankAchievements) {
			this.achievsToBackupSave.push(Game.BankAchievements[i]);
		}
		for (let i in Game.CpsAchievements) {
			this.achievsToBackupSave.push(Game.CpsAchievements[i]);
		}
		for (let i in Game.Objects) {
			for (let ii in Game.Objects[i].productionAchievs) {
				this.achievsToBackupSave.push(Game.Objects[i].productionAchievs[ii].achiev);
			}
		}
		this.achievsToBackupSave.push(Game.Achievements['Speed baking I']);
		this.achievsToBackupSave.push(Game.Achievements['Speed baking II']);
		this.achievsToBackupSave.push(Game.Achievements['Speed baking III']);

		eval('Game.goldenEffectSelect=function(me) { Math.seedrandom("GC/"+Game.seed+"/"+Game.goldenClicks); '+Game.shimmerTypes.golden.popFunc.toString().slice(Game.shimmerTypes.golden.popFunc.toString().indexOf('//select an effect'), Game.shimmerTypes.golden.popFunc.toString().indexOf('var choice=choose(list);'))+'Math.seedrandom(); return choose(list); }'); 

		Game.RebuildUpgrades();

		this.testCompute = function() {
			let hhhh = Date.now();
			Game.Logic();
			Game.Draw();
			return Date.now() - hhhh;
		}

		if (Crumbs.mobile) { 
			Game.Notify('Mobile notice', 'If you are currently using a phone to play Kaizo cookies, we strongly suggest that you use the horizontal orientation (long side on the bottom).', 0, 30);
		}

		//if (Game.cookiesEarned + Game.cookiesReset < 1000) { kaizoWarning = false; }
		allValues('init completion');

		eval('Game.ImportSaveCode='+Game.ImportSaveCode.toString().replace('var out=false;', 'var out=false; kaizoCookies.resetLoadStatuses();'));

		setTimeout(function() { if (!kaizoCookies.hasLoaded) { l('logButton').classList.add('hasUpdate'); } }, 500);
		this.canLoad = true;
		if (!this.hasLoaded && this.loadStr) { this.applyLoad(this.loadStr); }
	},
	save: function(){
		if (window.isEE) { return 'DOINIT'; }
		if (Game.SaveTo != 'kaizoCookiesSave') { 
			if (Game.modSaveData['Kaizo Cookies']) { return Game.modSaveData['Kaizo Cookies']; }
			else { return 'DOINIT'; }
		}
        let str = kaizoCookiesVer + '/';
        for(let i of kaizoCookies.achievements) {
          str+=i.unlocked; //using comma works like that in python but not js
          str+=i.bought; //seperating them otherwise it adds 1+1 and not "1"+"1"
        }
		str+='/';
		for (let i = 0; i < 20; i++) {
			str += decay.mults[i]; 
			str += ',';
		}
		str += decay.gen;
		str += '/' + decay.halt + ',' + decay.haltOvertime + ',' + decay.bankedPurification + '/';
		str += Game.pledgeT + ',' + Game.pledgeC;
		str += '/' + Game.veilHP + ',';
		if (Game.Has('Shimmering veil')) {
			if (Game.veilOn()) {
				str += 'on';
			} else if (Game.veilOff()) {
				str += 'off';
			} else if (Game.veilBroken()) {
				str += 'broken';
			}
		}
		str += ',';
		str += Game.veilRestoreC + ',' + Game.veilPreviouslyCollapsed + '/';
		for (let i in decay.prefs.preventNotifs) {
			str += (decay.prefs.preventNotifs[i]?1:0);
		}
		str += '/';
		str += 'h,' + decay.momentum;
        str += '/' + decay.CursedorUses + '/';
		for (let i in decay.times) {
			str += decay.times[i];
			str += ',';
		}
		str = str.slice(0, str.length - 1) + '/';
		for (let i in decay.prefs) {
			if (i != 'preventNotifs') { str += decay.prefs[i]; str += ','; }
		}
		str = str.slice(0, str.length - 1) + '/';
		for (let i in this.upgrades) {
			str += this.upgrades[i].won + ',';
		}
		str = str.slice(0, str.length - 1) + '/';
		str += decay.acceleration + '/';
		for (let i in Game.EnchantedPermanentUpgrades) {
			str += Game.EnchantedPermanentUpgrades[i] + ',';
		}
		str = str.slice(0, str.length - 1) + '/' + Game.TCount + '/';
		for (let i in decay.challenges) {
			str += decay.challenges[i].save() + ',';
		}
		str = str.slice(0, str.length - 1) + '/' + decay.currentConditional + '/' + Game.cookieClicksGlobal;
		str += '/' + Game.saveAllWrinklers() + '/' + decay.power + '/' + decay.timePlayed;
		str += '/' + decay.fatigue + '/' + decay.exhaustion + ',' + decay.timesExhausted + ',' + decay.timesExhaustedLocal + '/';
		for (let i = 0; i < decay.seFrees.length - 1; i++) { str += decay.seFrees[i] + ','; }
		str += decay.seFrees[decay.seFrees.length - 1];

		str += '/' + decay.getCurrentCovenantMode() + '/' + this.saveBackupStats() + '/' + decay.saveNGMInfo() + '/' + decay.gamePausedCount + '/' + decay.heavenlyKeyCharge;
		str += '/' + decay.saveUtenglobe() + '/' + decay.saveMaterialCounts() + '/' + decay.saveHaltValues() + '/' + decay.shattered;
		str += '/' + (decay.shatterFuseDrain ?? 'NA') + '/' + decay.highestReachedChallenged + '/' + decay.wrinklersPoppedTotal
		str += '/' + decay.saveEverBoughts() + '/' + decay.pausingCooldown + '/' + (decay.everUnlocked?1:0) + '/' + decay.saveTouchOfForce() + '/' + decay.saveBoundlessSack();
		str += '/' + decay.thunderMarkerObj.x + ',' + decay.thunderMarkerObj.y + '/' + (decay.clickHaltDisplayHidden?1:0) + '/' + (decay.lockedPreset==null?'NA':decay.lockedPreset);
		str += '/' + decay.purityKeyState + '/' + decay.saveScrolls() + '/' + decay.prestigeEscalationScrollBoostCount + '/' + decay.saveScrollExtras() + '/' + Game.hasTriggeredDifficultyRampingNotif + '/' + this.saveMinigames() + '/';

		for (let i = Game.ObjectsById.length - 1; i >= 0; i--) {
			if (Game.ObjectsById[i].everUnlocked) { str += i; break; }
		}

		str += '/' + decay.saveFurnace() + '/' + decay.clicksEligibleForPowerOrbs + '/' + decay.keepsakeSeason + '/' + decay.clicksKept + '/' + decay.saveLumpToys() + '/' + decay.speedsacChallengePrevStore;
        return str;
    },
	loadStr: '',
	toLoad: false,
	hasLoaded: 0,
	canLoad: false,
	resetLoadStatuses: function() {
		this.toLoad = false;
		this.hasLoaded = 0;
		kaizoWarning = false;
	},
    load: function(str) {
		//resetting stuff
		this.loadStr = str;
		if (this.canLoad && str != 'DOINIT') { this.applyLoad(str); return; }
	},
	achievsToBackupSave: [],
	saveModdedBuffs: function () {
		let str = '';
		for (var i in Game.buffs) {
			var me = Game.buffs[i];
			if (me.type) {
				//if (type == 3) str += '\n	' + me.type.name + ' : ';
				if (!me.type.vanilla) {
					str += me.type.name + '^' + me.maxTime + '^' + me.time;
					if (typeof me.arg1 !== 'undefined') str += '^' + parseFloat(me.arg1);
					if (typeof me.arg2 !== 'undefined') str += '^' + parseFloat(me.arg2);
					if (typeof me.arg3 !== 'undefined') str += '^' + parseFloat(me.arg3);
					str += ';';
				}
			}
		}
		return str;
	},
	loadModdedBuffs: function(str) {
		let buffsToLoad = [];
		let strs = str.split(';');
		for (let i in strs) {
			if (isv(strs[i])) { buffsToLoad.push(strs[i].split('^')); }
		}
		for (let i in buffsToLoad) {
			let mestr = buffsToLoad[i];
			if (!Game.buffTypesByName[mestr[0]]) { return; }
			Game.gainBuff(mestr[0], parseFloat(mestr[1]) / Game.fps, parseFloat(mestr[3] || 0), parseFloat(mestr[4] || 0), parseFloat(mestr[5] || 0)).time = parseFloat(mestr[2]);
		}
	},
	saveBackupStats: function() {
		let str = '';
		str += Game.cookiesEarned + '_' + Game.cookies + '_' + Game.lumps + '_' + Game.lumpsTotal + '_';
		for (let i in this.achievsToBackupSave) {
			str += this.achievsToBackupSave[i].won;
		}
		str += '_' + Game.researchT + '_';
		for (let i in Game.UpgradesByPool.tech) {
			str += Game.UpgradesByPool.tech[i].bought;
			str += Game.UpgradesByPool.tech[i].unlocked;
		}
		str += '_' + Game.nextResearch + '_' + Game.shimmerTypes.golden.time + '_' + Game.shimmerTypes.golden.last + '_' + Game.shimmerTypes.reindeer.time + '_' + this.saveModdedBuffs();

		return str;
	},
	loadBackupStats: function(str) {
		let strs = str.split('_');
		if (isv(strs[0])) { Game.cookiesEarned = parseFloat(strs[0]); }
		if (isv(strs[1])) { Game.cookies = parseFloat(strs[1]); }
		if (isv(strs[2])) { Game.lumps = parseFloat(strs[2]); }
		if (isv(strs[3])) { Game.lumpsTotal = parseFloat(strs[3]); }
		if (isv(strs[4])) { for (let i in this.achievsToBackupSave) {
			this.achievsToBackupSave[i].won = parseInt(strs[4][i]);
		} }
		if (isv(strs[5])) { 
			Game.researchT = parseInt(strs[5]); }
		if (isv(strs[6])) { 
			const strr = strs[6];
			for (let i = 0; i < Game.UpgradesByPool.tech.length; i++) {
				if (!strr[i * 2]) { break; }
				Game.UpgradesByPool.tech[i].bought = parseInt(strr[i * 2]);
				Game.UpgradesByPool.tech[i].unlocked = parseInt(strr[i * 2 + 1]);
			}
		}
		if (isv(strs[7])) { Game.nextResearch = parseInt(strs[7]); }
		Game.killShimmers();
		if (isv(strs[8])) { Game.shimmerTypes.golden.time = parseInt(strs[8]) / 2; }
		if (isv(strs[9])) { Game.shimmerTypes.golden.last = strs[9]; }
		if (isv(strs[10])) { Game.shimmerTypes.reindeer.time = parseInt(strs[10]) / 2; }
		if (isv(strs[11])) { this.loadModdedBuffs(strs[11]); }
	},
	applyLoad: function(str) {
		console.log('Kaizo Cookies loaded. Save string: '+str);
		if (kaizoCookies.unpauseGame) { kaizoCookies.unpauseGame(); }
		this.hasLoaded++;
		str = str.split('/'); 
		Game.CloseNotes();
		if (Crumbs.mobile) { 
			Game.Notify('Mobile notice', 'If you are currently using a phone to play Kaizo cookies, we strongly suggest that you use the horizontal orientation (long side on the bottom).', 0, 30);
		}
		decay.killAllPowerOrbs();
		if (decay.DEBUG) {
			if (Crumbs.mobile) {
				Game.Notify('Mobile', '', 0, 100000000, false, true);
			} else {
				Game.Notify('Not mobile', '', 0, 100000000, false, true);
			}
		}
		const version = getVer(str[0]);
		for (let i = 0; i < str[1].length; i += 2) { 
			//console.log(i, 'unlocked:' + str[1][i], 'bought:' + str[1][i + 1], kaizoCookies.achievements[i / 2].name);
           	if (isv(str[1][i])) { kaizoCookies.achievements[i / 2].unlocked=parseInt(str[1][i]); }
           	if (isv(str[1][i + 1])) { kaizoCookies.achievements[i / 2].bought=parseInt(str[1][i + 1]); }
		}
		let strIn = str[2].split(',');
		for (let i in strIn) {
			if (isv(strIn[i])) { decay.mults[i] = parseFloat(strIn[i]); }
		}
		allValues('load; upgrades and decay basic');
		if (isv(strIn[20])) { decay.gen = parseFloat(strIn[20]); }
		
		strIn = str[3].split(',');
		if (isv(strIn[0])) { decay.halt = parseFloat(strIn[0]); }
		if (isv(strIn[1])) { decay.haltOvertime = parseFloat(strIn[1]); }
		if (isv(strIn[2])) { decay.bankedPurification = parseFloat(strIn[2]); }
			
		strIn = str[4].split(',');
		if (isv(strIn[0])) { Game.pledgeT = parseFloat(strIn[0]); } else { Game.pledgeT = 0; }
		if (isv(strIn[1])) { Game.pledgeC = parseFloat(strIn[1]); }
		if (Game.pledgeT > 0 || Game.pledgeC > 0) { Game.Upgrades['Elder Pledge'].bought = 1; } else { Game.Upgrades['Elder Pledge'].bought = 0; }
		if (Game.pledgeC > 0) {
			Game.Upgrades["Elder Pledge"].icon[0] = 6; Game.Upgrades["Elder Pledge"].icon[1] = 3; Game.Upgrades["Elder Pledge"].icon[2] = kaizoCookies.images.custImg;
		}
		
		allValues('load; pledge and halt');
		strIn = str[5].split(',');
		
		if (isv(strIn[2])) { Game.veilRestoreC = parseFloat(strIn[2]); }
		if (isv(strIn[3])) { Game.veilPreviouslyCollapsed = Boolean(strIn[3]); }

		if (Game.Has('Shimmering veil')) { 
			Game.setVeilMaxHP();
			Game.veilHP = Game.veilMaxHP;
			Game.Lock('Shimmering veil [broken]');
			Game.Lock('Shimmering veil [on]');
			Game.Lock('Shimmering veil [off]');
			if (strIn[1] == 'on') {
				//Game.Upgrades['Shimmering veil [off]'].earn();
				Game.Upgrades['Shimmering veil [off]'].unlocked = 1;
				Game.Upgrades['Shimmering veil [off]'].bought = 1;
				Game.Lock('Shimmering veil [on]'); Game.Unlock('Shimmering veil [on]'); 
				Game.Lock('Shimmering veil [broken]');
			} else if (strIn[1] == 'off') {
				//Game.Upgrades['Shimmering veil [on]'].earn();
				Game.Upgrades['Shimmering veil [on]'].unlocked = 1;
				Game.Upgrades['Shimmering veil [on]'].bought = 1;
				Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
				Game.Upgrades['Shimmering veil [broken]'].unlocked = 0;
			} else if (strIn[1] == 'broken'){
				Game.Lock('Shimmering veil [on]'); Game.Lock('Shimmering veil [off]');
				//Game.Upgrades['Shimmering veil [broken]'].earn();
				Game.Upgrades['Shimmering veil [broken]'].unlocked = 1;
				Game.Upgrades['Shimmering veil [broken]'].bought = 1;
			} else {
				//Game.Upgrades['Shimmering veil [on]'].earn();
				Game.Upgrades['Shimmering veil [on]'].unlocked = 1;
				Game.Upgrades['Shimmering veil [on]'].bought = 1;
				Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
				Game.Upgrades['Shimmering veil [broken]'].unlocked = 0;
				console.log('veil: something went wrong');
			}
		}

		if (isv(strIn[0])) { veilHP = parseFloat(strIn[0]); }
   		
		allValues('load; veil');
		let counter = 0;
		strIn = str[6];
		for (let i in decay.prefs.preventNotifs) {
			if (isv(strIn[counter])) { decay.prefs.preventNotifs[i] = Boolean(parseInt(strIn[counter])); if (parseInt(strIn[counter])) { decay.hasEncounteredNotif = true; }}
			counter++;
		}
		strIn = str[7].split(',');
		if (isv(strIn[1])) { decay.momentum = parseFloat(strIn[1]); }
        if (isv(str[8])) { decay.CursedorUses = parseInt(str[8]); }
		strIn = str[9].split(',');
		counter = 0;
		for (let i in decay.times) {
			if (isv(strIn[counter])) { decay.times[i] = parseInt(strIn[counter]); }
			counter++;
		}
		decay.times.sinceGameLoad = 0;
		strIn = str[10].split(',');
		counter = 0;
		
		for (let i in decay.prefs) {
			if (isv(strIn[counter]) && i != 'preventNotifs') { decay.prefs[i] = parseInt(strIn[counter]); }
			if (i != 'preventNotifs') { counter++; }
		}
		if (decay.prefs.prestigeProgressDisplay && Game.prestige > 0 && Game.ascensionMode != 1) { decay.togglePreP(true); }
		
		strIn = str[11].split(',');
		for (let i = 0; i < strIn.length; i++) {
			if (isv(strIn[i])) { kaizoCookies.upgrades[i].won = parseInt(strIn[i]); }
		}
		Game.recalcAchievCount();
		
		strIn = str[12];
		if (isv(strIn)) { decay.acceleration = parseFloat(strIn); }

		strIn = str[13].split(',');
		for (let i in Game.EnchantedPermanentUpgrades) {
			if (isv(strIn[i])) { Game.EnchantedPermanentUpgrades[i] = parseFloat(strIn[i]); }
		}
		if (Game.EnchantedPermanentUpgrades[3] != -1 && Game.UpgradesById[Game.EnchantedPermanentUpgrades[3]].pool == 'cookie') { Game.EnchantedPermanentUpgrades[3] = -1; }
		if (Game.EnchantedPermanentUpgrades[4] != -1 && Game.UpgradesById[Game.EnchantedPermanentUpgrades[4]].pool == 'cookie') { Game.EnchantedPermanentUpgrades[4] = -1; }

		strIn = str[14];
		if (isv(strIn)) { Game.TCount = parseFloat(strIn); }

		strIn = str[15].split(',');
		counter = 0;
		for (let i in decay.challenges) {
			if (isv(strIn[counter])) { decay.challenges[i].load(strIn[counter]); }
			counter++;
		}

		if (typeof str[16] !== 'undefined') {
			if (str[16] == 'null') { decay.currentConditional = null; } else { decay.currentConditional = str[16]; }
		}
		decay.checkChallengeUnlocks();
		decay.getCompletionCount();
		decay.checkRotation();
		if (decay.currentConditional && decay.challenges[decay.currentConditional].init) { decay.challenges[decay.currentConditional].init(); }

		strIn = str[17];
		if (isv(strIn)) { Game.cookieClicksGlobal = parseFloat(strIn); if (Game.cookieClicksGlobal > decay.cookieClicksTotalNGM) { decay.cookieClicksTotalNGM = Game.cookieClicksGlobal; }}

		decay.removeAllWrinklers();
		Game.loadAllWrinklers(str[18]);
		decay.removeAllWrinklerSouls();

		strIn = str[19];
		if (isv(strIn)) { decay.power = parseFloat(strIn); }
		decay.loadPowerClicks();
		decay.buildPowerClickReqs();

		strIn = str[20];
		if (isv(strIn)) { decay.timePlayed = parseFloat(strIn); }

		strIn = str[21];
		if (isv(strIn)) { decay.fatigue = parseFloat(strIn); }

		strIn = str[22].split(',');
		if (isv(strIn[0])) { decay.exhaustion = parseFloat(strIn[0]); }
		if (isv(strIn[1])) { decay.timesExhausted = parseFloat(strIn[1]); }
		if (isv(strIn[2])) { decay.timesExhaustedLocal = parseFloat(strIn[2]); }

		strIn = str[23].split(',');
		for (let i in strIn) {
			if (isv(strIn[i])) { decay.seFrees[i] = parseFloat(strIn[i]); }
		}

		strIn = str[24];
		decay.setupCovenant();
		if (isv(strIn) && strIn != 'NA' && decay.covenantModes[strIn]) {
			decay.covenantModes[strIn].upgrade.unlocked = 1;
			decay.covenantModes[strIn].upgrade.bought = 0;
			//console.log(strIn);
		}
		if (!decay.isCovenantUnlocked()) { decay.covenantModes.off.upgrade.bought = 1; }

		strIn = str[25];
		if (isv(strIn)) {
			this.loadBackupStats(strIn);
		}

		decay.loadNGMInfo(str[26]);

		if (isv(str[27])) { decay.gamePausedCount = parseFloat(str[27]); }

		if (isv(str[28])) { decay.heavenlyKeyCharge = parseFloat(str[28]); }

		if (isv(str[29])) { decay.loadUtenglobe(str[29]); }

		if (isv(str[30])) { decay.loadMaterialCounts(str[30]); }

		if (isv(str[31])) { decay.loadHaltValues(str[31]); }
		
		if (isv(str[32])) { decay.shattered = parseFloat(str[32]); }
		if (isv(str[33]) && str[33] != 'NA') { decay.shatterFuseDrain = parseFloat(str[33]); }

		if (isv(str[34])) { decay.highestReachedChallenged = parseFloat(str[34]); }

		if (isv(str[35])) { decay.wrinklersPoppedTotal = parseFloat(str[35]); }

		if (isv(str[36])) { decay.loadEverBoughts(str[36]); }
		decay.ascendKeptUpgradeList = decay.getAscendKeptUpgradeList();

		if (isv(str[37])) { decay.pausingCooldown = parseFloat(str[37]); }

		if (isv(str[38])) { decay.everUnlocked = Boolean(parseFloat(str[38])); }

		if (isv(str[39])) { decay.loadTouchOfForce(str[39]); }

		if (isv(str[40])) { decay.loadBoundlessSack(str[40]); }

		if (str[41]) { strIn = str[41].split(','); } else { strIn = []; }
		if (isv(strIn[0])) { decay.thunderMarkerObj.x = parseFloat(strIn[0]); }
		if (isv(strIn[1])) { decay.thunderMarkerObj.y = parseFloat(strIn[1]); }
		if (Game.Has('Thunder marker')) { decay.thunderMarkerObj.enabled = true; }

		if (isv(str[42])) { decay.clickHaltDisplayHidden = Boolean(parseFloat(str[42])); }
		if (decay.clickHaltDisplayHiddenClick) {
			decay.hideClickHaltDisplay();
		}
		if (Game.cookiesEarned + Game.cookiesReset > 1e6) { 
			l('clickHaltDisplayContainer').style.display = ''; 
		} else {
			l('clickHaltDisplayContainer').style.display = 'none'; 
		}

		if (isv(str[43]) && str[43] != 'NA') { decay.lockedPreset = parseInt(str[43]); }

		if (isv(str[44])) { decay.purityKeyState = parseInt(str[44]); }

		if (isv(str[45])) { decay.loadScrolls(str[45]); }

		if (isv(str[46])) { decay.prestigeEscalationScrollBoostCount = parseFloat(str[46]); }

		if (isv(str[47])) { decay.loadScrollExtras(str[47]); }

		if (isv(str[48])) { Game.hasTriggeredDifficultyRampingNotif = parseFloat(str[48]); }

		if (isv(str[49])) { this.loadMinigames(str[49]); }

		if (isv(str[50])) { 
			let building = parseFloat(str[50]);
			for (let i = 0; i <= building; i++) {
				Game.ObjectsById[i].everUnlocked = true;
			}
		}

		if (isv(str[51])) { 
			decay.loadFurnace(str[51]);
		}
		
		if (isv(str[52])) { decay.clicksEligibleForPowerOrbs = parseFloat(str[52]); }

		if (isv(str[53])) { decay.keepsakeSeason = str[53]; }

		if (isv(str[54])) { decay.clicksKept = parseFloat(str[54]); }

		if (isv(str[55])) { decay.loadLumpToys(str[55]); }

		if (isv(str[56])) { decay.speedsacChallengePrevStore = str[56]; }
		
		decay.checkBuildingEverUnlocks();
    	Game.storeToRefresh=1;

		kaizoCookies.lastPause = 0;

		decay.setRates();
		decay.assignThreshold();
		Game.RebuildUpgrades();
		decay.checkChallengeUnlocks();
		//if (Game.specialTab) { Game.ToggleSpecialMenu(1); }

		allValues('load completion');
    }
});
