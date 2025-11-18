const canvas = document.getElementById('moba-map');
const ctx = canvas.getContext('2d');

// --- GAME STATE ---
const gameState = {
    // Goal is now Profit: $500,000
    influencePoints: {
        blue: 0,
        red: 0,
        target: 500000 // Winning Score in Profit (The Edge)
    },
    zones: [
        // Casino Objectives
        { id: 'high_limit', x: 200, y: 100, size: 40, owner: 'neutral', cashRate: 1500 }, 
        { id: 'slot_cage', x: 400, y: 300, size: 60, owner: 'neutral', cashRate: 2000 },
        { id: 'back_room', x: 600, y: 500, size: 40, owner: 'neutral', cashRate: 1500 },
    ],
    winCheckInterval: 2, 
    heroes: {
        // --- CASINO CHARACTERS ---
        'Sam Rothstein': { q: "The Eye in the Sky", w: "The Payout", e: "The Chip Run", r_ultimate: "The System" },
        'Nicky Santoro': { q: "The Wire", w: "Leave the Desert", e: "The Temper", r_ultimate: "The Baseball Bat" },
        'Ginger McKenna': { q: "The Lure", w: "The Distraction", e: "The Safe Deposit", r_ultimate: "The Mother’s Fury" }, // Reusing Carmela's ultimate theme
    }
};

// --- PLAYER STATE (CURRENT HERO) ---
let player = {
    name: 'Sam Rothstein',
    x: 100,
    y: 500,
    level: 1,
    xp: 0,
    cash: 500,
    
    // RESOURCE NAMES UPDATED: Willpower -> Control, Heat -> Focus
    willpower: 100, // Now called CONTROL
    maxWillpower: 100,
    heat: 0,        // Now called FOCUS
    maxHeat: 100,
    
    isRaging: false,
    rageDuration: 10, 
    rageTimer: 0,
    isGuarding: false, // Guarding is now "The Cleanup"
    
    color: '#ffd700' // Gold/Yellow (changed from blue for visual appeal)
};


// --- RESOURCE AND ULTIMATE MECHANICS ---

function updateResources(delta) {
    // 1. Control Regeneration
    if (player.willpower < player.maxWillpower) {
        player.willpower += 3 * delta; 
        if (player.willpower > player.maxWillpower) {
            player.willpower = player.maxWillpower;
        }
    }
    
    // 2. Focus Timer (Ultimate)
    if (player.isRaging) {
        player.rageTimer -= delta;
        if (player.rageTimer <= 0) {
            deactivateRage();
        }
    }

    // 3. Check if Rage is ready
    if (player.heat >= player.maxHeat) {
        document.getElementById('rage-button').classList.add('ready');
        document.getElementById('rage-button').disabled = false;
    } else {
        document.getElementById('rage-button').classList.remove('ready');
        if (!player.isRaging) document.getElementById('rage-button').disabled = true;
    }
    
    // Update the UI bars
    document.getElementById('willpower-bar').style.width = `${(player.willpower / player.maxWillpower) * 100}%`;
    document.getElementById('heat-bar').style.width = `${(player.heat / player.maxHeat) * 100}%`;
    document.getElementById('cash').textContent = `$${player.cash}`;
    document.getElementById('level').textContent = player.level;
}

function activateRage() {
    if (player.heat >= player.maxHeat && !player.isRaging) {
        player.isRaging = true;
        player.heat = 0;
        player.rageTimer = player.rageDuration;
        canvas.classList.add('raging');
        document.getElementById('ability-r').disabled = false; 
        console.log("🔥 THE VIG ACTIVATED! THE SYSTEM UNLOCKED!");
        document.getElementById('rage-button').disabled = true;
    }
}

function deactivateRage() {
    player.isRaging = false;
    canvas.classList.remove('raging');
    document.getElementById('ability-r').disabled = true;
    console.log("The Vig has worn off.");
}

function gainHeat(amount) {
    player.heat += amount;
    if (player.heat > player.maxHeat) player.heat = player.maxHeat;
}

function gainCash(amount) {
    player.cash += amount;
}

function useAbility(abilityKey) {
    const cost = 25; 

    if (abilityKey === 'Q' && player.willpower >= cost) {
        player.willpower -= cost;
        gainHeat(10); // Gain Focus upon using an ability
        console.log("Using The Hit (Q).");
    } else if (abilityKey === 'R' && player.isRaging) {
        console.log("💥 THE SYSTEM ULTIMATE ACTIVATED!");
        deactivateRage(); 
    } else {
        console.log("Not enough Control or ability is locked.");
    }
}

// --- OBJECTIVE AND WIN CONDITION (The Edge) ---

function updateScoreboard() {
    // Score is tracked as cash/edge
    document.getElementById('blue-score').textContent = `Blue Crew Edge: $${Math.floor(gameState.influencePoints.blue).toLocaleString()}`;
    document.getElementById('red-score').textContent = `Red Crew Edge: $${Math.floor(gameState.influencePoints.red).toLocaleString()}`;
}

function checkWinCondition() {
    if (gameState.influencePoints.blue >= gameState.influencePoints.target) {
        alert("BLUE CREW WINS! The House Always Wins!");
    } else if (gameState.influencePoints.red >= gameState.influencePoints.target) {
        alert("RED CREW WINS! They Took The Edge!");
    }
}

function updateZones(delta) {
    // Objectives now grant PROFIT (The Edge)
    gameState.zones.forEach(zone => {
        // Hard-coded ownership for testing Ace's side
        if (zone.id === 'slot_cage') {
            zone.owner = 'blue'; 
        }
        
        if (zone.owner === 'blue') {
            gameState.influencePoints.blue += zone.cashRate * delta;
        } else if (zone.owner === 'red') {
            gameState.influencePoints.red += zone.cashRate * delta;
        }
        
        gameState.influencePoints.blue = Math.min(gameState.influencePoints.blue, gameState.influencePoints.target);
        gameState.influencePoints.red = Math.min(gameState.influencePoints.red, gameState.influencePoints.target);
    });

    updateScoreboard();
}

// --- DRAWING AND GAME LOOP ---

function drawPlayer() {
    // (This remains the same until sprite sheets are added)
    ctx.fillStyle = player.isGuarding ? '#00FFFF' : player.color; // Cyan when guarding
    ctx.beginPath();
    ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`Lvl ${player.level}`, player.x, player.y - 20);
}

function drawZones() {
    gameState.zones.forEach(zone => {
        ctx.fillStyle = zone.owner === 'blue' ? 'rgba(52, 152, 219, 0.5)' : 
                        zone.owner === 'red' ? 'rgba(231, 76, 60, 0.5)' : 
                        'rgba(149, 165, 166, 0.5)';
        
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.fillText(zone.id.toUpperCase(), zone.x, zone.y);
    });
}

function gameLoop() {
    const now = Date.now();
    const delta = (now - (gameLoop.lastTime || now)) / 1000;
    gameLoop.lastTime = now;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map elements
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(800, 100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(800, 500); ctx.stroke();

    drawZones();
    updateResources(delta);
    updateZones(delta);
    
    if (Date.now() - (gameLoop.lastWinCheck || 0) > gameState.winCheckInterval * 1000) {
        checkWinCondition();
        gameLoop.lastWinCheck = Date.now();
    }
    
    drawPlayer();
    requestAnimationFrame(gameLoop);
}


// --- USER INPUT (Movement and The Cleanup/Guard) ---
window.addEventListener('keydown', (e) => {
    const step = 10;
    if (e.key === 'ArrowRight') player.x += step;
    if (e.key === 'ArrowLeft') player.x -= step;
    if (e.key === 'ArrowUp') player.y -= step;
    if (e.key === 'ArrowDown') player.y += step;
    
    // THE CLEANUP (Guard)
    if (e.key.toUpperCase() === 'G' && !player.isGuarding) {
        player.isGuarding = true;
        console.log("The Cleanup activated! Reduced incoming damage.");
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key.toUpperCase() === 'G') {
        player.isGuarding = false;
        console.log("Guard relaxed.");
    }
});


// Start the game
gameLoop.lastTime = Date.now();
gameLoop.lastWinCheck = Date.now();
gameLoop();
