let game = $('#game');
let gun = $('#gun');
let canvas = $('#canvas');
let mouse = {x: 0, y: 0};
let entities = [];
let records = [];

$(window).on('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = window.innerHeight - e.clientY;

    var boxCenter=[gun.offset().left+gun.width()/2, gun.offset().top+gun.height()/2];
    var angle = Math.atan2(e.pageX - boxCenter[0], - (e.pageY - boxCenter[1]) )*(180/Math.PI);      

    gun.css({ "-webkit-transform": 'rotate(' + angle + 'deg)'});    
    gun.css({ '-moz-transform': 'rotate(' + angle + 'deg)'});
})

$(window).on('click', function (e) {
    if (myGameArea.cooldown > 0) return;
    let gun_pos = gun.position()
    let bullet = new component(30, 30, 'green', 100, window.innerHeight - 150, 'ellipse', 'bullet');
    bullet.speedX = (mouse.x / window.innerWidth) * 30;
    bullet.speedY = (mouse.y / window.innerHeight) * -30;
    entities.push(bullet);
    myGameArea.cooldown = 40;
})

function component(width, height, color, x, y, type, kind) {
    this.kind = kind
    this.type = type;
    this.color = color;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.gravity = 0.2;
    this.gravitySpeed = 0;
    this.update = function() {
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        if (this.kind === 'enemy') {
            let pirate = document.createElement('img');
            pirate.src = './images/pirate.png';
            ctx.drawImage(pirate, this.x, this.y, this.width, this.height);
        } else if (this.kind === 'bullet') {
            let ball = document.createElement('img');
            ball.src = './images/ball.png';
            ctx.drawImage(ball, this.x, this.y, this.width, this.height);
        }
        else if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'rect') {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width, this.height, Math.PI / 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    this.newPos = function() {
        this.gravitySpeed += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY + this.gravitySpeed;
        // this.hitBottom();
    }
}

function hideMenu() {
    $('.menu-wrapper > *').hide();
}

function showMenu() {
    renderRecords();
    $('.menu-wrapper > *').show();
}

function loadRecords() {
    try {
       records = JSON.parse(localStorage.getItem('records')) || [];
    } catch (e) { records = [] };
}

function saveRecords() {
    localStorage.setItem('records', JSON.stringify(records));
}

function renderRecords() {
    loadRecords();
    let tbody = $('.records tbody');
    tbody.html('');
    for (let k = 0; k < records.length; k++) {
        tbody.append(`
            <tr>
                <td>${records[k][0]}</td>
                <td>${records[k][1]}</td>
            </tr>
        `)
    }
    saveRecords();
}

function saveRecord() {
    loadRecords();
    let username = $('.username-field').val() || $('.username-field').attr('placeholder');
    let score = myGameArea.score;
    let usernames = records.map(x => x[0]);
    if (usernames.indexOf(username) > -1) {
        if (records[usernames.indexOf(username)][1] < score)
            records[usernames.indexOf(username)][1] = score;
    } else {
        records.push([username, score]);
    }
    saveRecords();
}

$('.pause-button').click(function(e) {
    myGameArea.pause();
    showMenu();
})

function startGame() {
    myScore = new component("30px", "Consolas", "black", 40, 40, "text");
    myCooldown = new component("30px", "Consolas", "black", 40, 70, "text");
    myHelth = new component("30px", "Consolas", "black", 40, 100, "text");
    myGameArea.start();

    $('.options li').click(function (e) {
        let mode = $(e.target).data('mode');
        hideMenu();
        if (mode === 'play' && myGameArea.healthes < 0)
            mode = 'restart';

        if (mode === 'play') {
            myGameArea.unpause();
        } else if (mode === 'restart') {
            myGameArea.restart();
        }
    })
}

var myGameArea = {
    canvas : canvas[0],
    start() {
        this.canvas.width = $(window).width();
        this.canvas.height = $(window).height();
        this.context = this.canvas.getContext("2d");
        this.restart();
        this.pause();
        showMenu();
        updateGameArea();
        },
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    restart() {
        entities = [];
        this.score = 0;
        this.cooldown = 0;
        this.healthes = 3;
        this.frameNo = 0;
        this.unpause();
    },
    pause() {
        clearInterval(myGameArea.interval);
    },
    unpause() {
        myGameArea.interval = setInterval(updateGameArea, 20);
    }
}

function isCollededRectCircle(rect, circle) {
    var distX = Math.abs(circle.x - rect.x-rect.width/2);
    var distY = Math.abs(circle.y - rect.y-rect.height/2);
    let r = (circle.height + circle.width) / 2;
    if (distX > (rect.width/2 + r)) { return false; }
    if (distY > (rect.height/2 + r)) { return false; }
    if (distX <= (rect.width/2)) { return true; } 
    if (distY <= (rect.height/2)) { return true; }
    var dx=distX-rect.width/2;
    var dy=distY-rect.height/2;
    return (dx*dx+dy*dy<=(r*r));
}

function updateGameArea() {
    var x, height, gap, minHeight, maxHeight, minGap, maxGap;
    myGameArea.clear();
    myGameArea.frameNo += 1;
    if (myGameArea.cooldown > 0)
        myGameArea.cooldown -= 1;

    let level = Math.floor(myGameArea.score  / 500)
    let currInterval = 80 - (level * 6);
    if (myGameArea.frameNo == 1 || everyinterval(currInterval)) {
        x = myGameArea.canvas.width + 20;
        y = Math.round(Math.random() * (myGameArea.canvas.height - 300));
        minHeight = 20;
        maxHeight = 200;
        height = Math.floor(Math.random()*(maxHeight-minHeight+1)+minHeight);
        minWidth = 50;
        maxWidth = 200;
        width = Math.floor(Math.random()*(maxWidth-minWidth+1)+minWidth);

        enemy = new component(width, height, 'red', x, y, 'rect', 'enemy');
        enemy.speedX = (-5 - level) * ((Math.random() * 3) + 1);
        enemy.gravity = 0;
        entities.push(enemy);
    }

    enemies = entities.filter(x => x.kind === 'enemy');
    bullets = entities.filter(x => x.kind === 'bullet');
    for (let k = 0; k < enemies.length; k++) {
        let enemy = enemies[k];
        for (let i = 0; i < bullets.length; i++) {
            let bullet = bullets[i];
            if (isCollededRectCircle(enemy, bullet)) {
                entities.splice(entities.indexOf(enemy), 1);
                entities.splice(entities.indexOf(bullet), 1);
                myGameArea.score += 50;
                saveRecord();
            }
        }
    }

    // очищаем невидимые элементы
    for (let k = 0; k < entities.length; k) {
        if (entities[k].x < 0 || entities.x > myGameArea.canvas.width || entities.y > myGameArea.canvas.height || entities.y < 0) {
            if (entities[k].kind === 'enemy') {
                myGameArea.healthes -= 1;
            }
            entities.splice(k, 1);
        }
        else k++
    }

    myScore.text="SCORE: " + myGameArea.score;
    myScore.update();
    myCooldown.text = 'COOLDOWN: ' + myGameArea.cooldown;
    myCooldown.update();
    myHelth.text = 'HEALTH: ' + (myGameArea.healthes >= 0 ? myGameArea.healthes : 'DEAD');
    myHelth.update();
    for (let k = 0; k < entities.length; k++) {
        entities[k].newPos();
        entities[k].update();
    }

    if (myGameArea.healthes < 0) {
        myGameArea.pause();
        saveRecord();
        showMenu();
    }
}

function everyinterval(n) {
    return (myGameArea.frameNo / n) % 1 == 0;
}

$(window).ready(function() {
    startGame();
})
