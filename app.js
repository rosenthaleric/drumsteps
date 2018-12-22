(() => {

    let canvas = document.getElementById("backgroundCanvas"),
        vertOverlayCanvas = document.getElementById("vertOverlayCanvas"),
        rectPrevCanvas = document.getElementById("rectCanvas"),
        instrumentCanvas = document.getElementById("instrumentCanvas"),
        liveTickCanvas = document.getElementById("liveTick");

    let ctx = canvas.getContext("2d"),
        ctxVertOverlay = vertOverlayCanvas.getContext("2d"),
        rectCtx = rectPrevCanvas.getContext("2d"),
        instrumCtx = instrumentCanvas.getContext("2d"),
        liveTickCtx = liveTickCanvas.getContext("2d");

    let procanvas = document.getElementById("particleCanvas"),
        context = procanvas.getContext('2d'),
        renderer = new Proton.CanvasRenderer(procanvas),
        emitterList = [],
        proton = new Proton;

    const cWidth = canvas.getAttribute("width"),
        cHeight = canvas.getAttribute("height"),
        measure32Widths = canvas.getAttribute("width") / 32,
        measure7Heights = canvas.getAttribute("height") / 7;

    let vertRects = [],
        instrumentPrevRects = [],
        liveTickRects = [],
        instruments = [],
        setlist = [];

    let infoField = document.getElementsByClassName("info")[0],
        playButton = document.getElementsByClassName("button")[0],
        playSwitch = false;

    //____________________________________________________________________________________________________

    rectPrevCanvas.onmouseleave = () => {
        let j = 0, s;
        while (s = vertRects[j++]) {
            ctxVertOverlay.beginPath();
            ctxVertOverlay.rect(s.x, s.y, s.w, s.h);
            ctxVertOverlay.clearRect(s.x, s.y, s.w, s.h);
            ctxVertOverlay.closePath();
            s.isDrawn = false;
        }

        let h = 0, t;
        while (t = instrumentPrevRects[h++]) {
            rectCtx.beginPath();
            rectCtx.rect(t.x, t.y, t.w, t.h);
            rectCtx.clearRect(t.x, t.y, t.w, t.h);
            rectCtx.closePath();
            t.isPrev = false;
        }

        infoField.innerHTML = '';
    }

    let slider = document.getElementById("myRange");
    let output = document.getElementsByClassName("number")[0];
    slider.value = 120;
    Tone.Transport.bpm.value = 120;
    output.innerHTML = slider.value;
    slider.oninput = () => {
        output.innerHTML = slider.value;
        Tone.Transport.bpm.rampTo(slider.value, 0.0000001);
    }

    // Initialize empty 2d matrix of notes
    let initSetlist = () => {
        for (let k = 0; k < 32; ++k) {
            let col = [],
                i = 0;
            while (i < 7) {
                col.push(0);
                ++i;
            }
            setlist.push(col);
        }
    }

    // Draw Background one-measure notesheet
    let drawMeasure = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, cWidth, cHeight);

        for (let i = 1; i < 7; ++i) {
            ctx.beginPath();
            ctx.moveTo(0, i * cHeight / 7);
            ctx.lineTo(cWidth, i * cHeight / 7);
            ctx.stroke();
            ctx.closePath();
        }

        for (let i = 1; i < 4; ++i) {
            ctx.beginPath();
            ctx.moveTo(i * cWidth / 4, 0);
            ctx.lineTo(i * cWidth / 4, cHeight);
            ctx.stroke();
            ctx.closePath();
        }
    }

    // Popularize preview-hover arrays with rectangles (vertical and small instruments)
    let initRects = () => {
        //Vertical Prev
        for (let i = 0; i < 32; i++) {
            vertRects.push({ x: i * measure32Widths, y: 0, w: measure32Widths - 0.01, h: cHeight, isDrawn: false });
        }

        // Live Tick Rects
        for (let i = 0; i < 32; i++)  {
            liveTickRects.push({ x: i * measure32Widths, y: 0, w: measure32Widths - 0.01, h: cHeight, isDrawn: false });
        }

        //Instrument Previews
        for (let k = 0; k < 7; ++k) {
            for (let l = 0; l < 32; ++l) {
                instrumentPrevRects.push({
                    x: l * measure32Widths, y: k * measure7Heights, w: measure32Widths - 0.01,
                    h: measure7Heights, instr: k, isPrev: false
                });
            }
        }

        //Instruments
        for (let k = 0; k < 7; ++k) {
            for (let l = 0; l < 32; ++l) {
                instruments.push({
                    x: l * measure32Widths, y: k * measure7Heights, w: measure32Widths - 0.01,
                    h: measure7Heights, instr: k, isDrawn: false
                });
            }
        }
    }

    // Draw vertical preview-hover rectangle
    let drawVerticalPrev = () => {
        rectPrevCanvas.onmousemove = (e) => {
            let rect = canvas.getBoundingClientRect(),
                x = e.clientX - rect.left,
                y = e.clientY - rect.top,
                i = 0,
                r;

            drawInstrumentPrev(x, y);

            while (r = vertRects[i++]) {

                ctxVertOverlay.beginPath();
                ctxVertOverlay.rect(r.x, r.y, r.w, r.h);

                if (ctxVertOverlay.isPointInPath(x, y) && !r.isDrawn) {
                    ctxVertOverlay.fillStyle = "rgba(92, 11, 232, 0.1)";
                    ctxVertOverlay.fill();
                    r.isDrawn = true;
                }

                else if (ctxVertOverlay.isPointInPath(x, y) && r.isDrawn) {
                    return;
                }
                else {
                    ctxVertOverlay.clearRect(r.x, r.y, r.w, r.h);
                    r.isDrawn = false;
                }
            }
        }
    }

    /**
     * Draw small preview-hover instrument rectangles
     * Called within drawVerticalPrev()  
     */
    let drawInstrumentPrev = (x, y) => {
        let i = 0, r;
        while (r = instrumentPrevRects[i++]) {

            rectCtx.beginPath();
            rectCtx.rect(r.x, r.y, r.w, r.h);

            if (rectCtx.isPointInPath(x, y) && !r.isPrev) {
                switch (r.instr) {
                    case 0: rectCtx.fillStyle = "rgba(12, 223, 255, 0.3)"; break;  // Crash
                    case 1: rectCtx.fillStyle = "rgba(12, 139, 232, 0.3)"; break;  // HiHat
                    case 2: rectCtx.fillStyle = "rgba(3, 6, 255, 0.3)"; break;     // HiTom 1
                    case 3: rectCtx.fillStyle = "rgba(80, 3, 232, 0.3)"; break;    // Snare
                    case 4: rectCtx.fillStyle = "rgba(177, 9, 255, 0.3)"; break;   // HiTom 2
                    case 5: rectCtx.fillStyle = "rgba(232, 3, 220, 0.3)"; break;   // FloorTom
                    case 6: rectCtx.fillStyle = "rgba(255, 4, 82, 0.3)"; break;    // Kick
                }
                rectCtx.fill();
                r.isPrev = true;
                setInfo(r.instr);
            }
            else if (rectCtx.isPointInPath(x, y) && r.isPrev) {
                return;
            }
            else if (r.isPrev) {
                rectCtx.clearRect(r.x, r.y, r.w, r.h);
                r.isPrev = false;
            }
        }

    }

    let setInfo = (instr) => {
        switch (instr) {
            case 0: infoField.innerHTML = 'Crash'; break;
            case 1: infoField.innerHTML = 'Hi-Hat'; break;
            case 2: infoField.innerHTML = 'Tom 1'; break;
            case 3: infoField.innerHTML = 'Snare'; break;
            case 4: infoField.innerHTML = 'Tom 2'; break;
            case 5: infoField.innerHTML = 'Floortom'; break;
            case 6: infoField.innerHTML = 'Kick'; break;
        }
    }

    /**
     * Check if instrument is already drawn on instrumCanvas
     * If not draw it permanently, else delete already drawn instrument
     */
    let drawInstruments = () => {
        rectPrevCanvas.onclick = (e) => {
            let rect = canvas.getBoundingClientRect(),
                x = e.clientX - rect.left,
                y = e.clientY - rect.top,
                i = 0,
                r;

            while (r = instruments[i++]) {

                instrumCtx.beginPath();
                instrumCtx.rect(r.x, r.y, r.w, r.h);

                if (instrumCtx.isPointInPath(x, y) && !r.isDrawn) {
                    switch (r.instr) {
                        case 0: instrumCtx.fillStyle = "rgb(12, 223, 255)"; break;      // Crash
                        case 1: instrumCtx.fillStyle = "rgb(12, 139, 232)"; break;      // HiHat
                        case 2: instrumCtx.fillStyle = "rgb(3, 6, 255)"; break;         // Tom 1
                        case 3: instrumCtx.fillStyle = "rgb(80, 3, 232)"; break;        // Snare
                        case 4: instrumCtx.fillStyle = "rgb(177, 9, 255)"; break;       // Tom 2
                        case 5: instrumCtx.fillStyle = "rgb(232, 3, 220)"; break;       // Floor Tom
                        case 6: instrumCtx.fillStyle = "rgb(255, 4, 82)"; break;        // Kick
                    }
                    instrumCtx.fill();
                    setNote(r.x, r.instr);
                    r.isDrawn = true;
                }
                else if (instrumCtx.isPointInPath(x, y) && r.isDrawn) {
                    instrumCtx.clearRect(r.x, r.y, r.w, r.h);
                    deleteNote(r.x, r.instr);
                    r.isDrawn = false;
                }
                else if (!r.isDrawn) {
                    instrumCtx.clearRect(r.x, r.y, r.w, r.h);
                    r.isDrawn = false;
                }
            }
        }
    }

    //_______________________________________________________________________________________________

    // Set note in setlist array to 1
    let setNote = (x, instr) => {
        let col = x / measure32Widths;
        setlist[col][instr] = 1;
    }

    // Set note in setlist array to 0
    let deleteNote = (x, instr) => {
        let col = x / measure32Widths;
        setlist[col][instr] = 0;
    }

    let notes = new Tone.Players({
        "crash": "sounds/crash.[wav|ogg]",
        "hihat": "sounds/hihat.[wav|ogg]",
        "tom1": "sounds/tom1.[wav|ogg]",
        "snare": "sounds/snare.[wav|ogg]",
        "tom2": "sounds/tom2.[wav|ogg]",
        "floortom": "sounds/floortom.[wav|ogg]",
        "kick": "sounds/kick.[wav|ogg]",
    }, {
            "volume": -10,
            "fadeOut": "64n",
        }).toMaster();

    // initialize the 32nd note Tone.js sequence and schedule the livetick and particle emission
    let noteNames = ["crash", "hihat", "tom1", "snare", "tom2", "floortom", "kick"];
    let loop = new Tone.Sequence(function (time, col) {
        for (let i = 0; i < 7; ++i) {
            if (setlist[col][i] === 1) notes.get(noteNames[i]).start(time, 0);
        }
        Tone.Draw.schedule(() => {
            for (let i = 0; i < 7; ++i) {
                if (setlist[col][i] === 1) {
                    emit(i)
                }
            }
            let i = -1, r;
            while (r = liveTickRects[++i]) {
                liveTickCtx.beginPath();
                liveTickCtx.rect(r.x, r.y, r.w, r.h);
                if (i === col) {
                    liveTickCtx.fillStyle = "rgba(214, 114, 147, 0.3)";
                    r.isDrawn = true;
                    liveTickCtx.fill();
                    liveTickCtx.closePath();
                }
                else {
                    liveTickCtx.clearRect(r.x, r.y, r.w, r.h);
                    r.isDrawn = false;
                }
            }
        }, time);
    }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
            22, 23, 24, 25, 26, 27, 28, 29, 30, 31], "32n");

    playButton.onclick = () => {
        Tone.context.resume().then(() => {
            playButton.classList.toggle("paused");
            if (!playSwitch) {
                    Tone.Transport.start();
                    loop.start();
            }
            else {
                Tone.Transport.stop();
                loop.stop();

                let i = -1, r;
                while (r = liveTickRects[++i]) {
                    liveTickCtx.beginPath();
                    liveTickCtx.rect(r.x, r.y, r.w, r.h);
                    liveTickCtx.clearRect(r.x, r.y, r.w, r.h);
                    r.isDrawn = false;
                }
            }
            playSwitch = !playSwitch;
        });
    }

    // create different particle emitter for each instrument
    let initEmitter = (instr) => {
        let emitter = new Proton.Emitter();
        emitter.rate = new Proton.Rate(new Proton.Span(5, 10), new Proton.Span(.5, 1));

        emitter.addInitialize(new Proton.Mass(1));
        emitter.addInitialize(new Proton.Life(2, 4));

        emitter.addBehaviour(new Proton.Alpha(1, 0));
        emitter.addBehaviour(new Proton.Scale(1));
        emitter.addBehaviour(new Proton.Gravity(5));
        emitter.addBehaviour(new Proton.Collision(emitter));
        emitter.addBehaviour(customDeadBehaviour());
        emitter.addBehaviour(new Proton.CrossZone(new Proton.RectZone(-200, -200, procanvas.width + 400, procanvas.height + 200), 'bound'));

        switch (instr) {
            case 0: {
                emitter.addBehaviour(new Proton.Color("#0CDFFF"));
                emitter.addInitialize(new Proton.Radius(3, 8));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 8), new Proton.Span(0, 25, true), 'polar'));
                break;
            }     // Crash
            case 1: {
                emitter.addBehaviour(new Proton.Color("#0C8BE8"));
                emitter.addInitialize(new Proton.Radius(1, 4));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 4), new Proton.Span(0, 30, true), 'polar'));
                break;
            }     // HiHat
            case 2: {
                emitter.addBehaviour(new Proton.Color("#0306FF"));
                emitter.addInitialize(new Proton.Radius(1, 5));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 4.5), new Proton.Span(0, 30, true), 'polar'));
                break;
            }         // Tom 1
            case 3: {
                emitter.addBehaviour(new Proton.Color("#5003E8"));
                emitter.addInitialize(new Proton.Radius(3, 8));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 8), new Proton.Span(0, 30, true), 'polar'));
                break;
            }        // Snare
            case 4: {
                emitter.addBehaviour(new Proton.Color("#B109FF"));
                emitter.addInitialize(new Proton.Radius(2, 7));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 6), new Proton.Span(0, 30, true), 'polar'));
                break;
            }       // Tom 2
            case 5: {
                emitter.addBehaviour(new Proton.Color("#E803DC"));
                emitter.addInitialize(new Proton.Radius(3, 8));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 7), new Proton.Span(0, 30, true), 'polar'));
                break;
            }       // Floor Tom
            case 6: {
                emitter.addBehaviour(new Proton.Color("#FF0452"));
                emitter.addInitialize(new Proton.Radius(4, 9));
                emitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 8), new Proton.Span(0, 30, true), 'polar'));
                break;
            }        // Kick
        }

        // set emission origin for each instrument, left to right
        emitter.p.x = (procanvas.width / 8) * (7 - instr);
        emitter.p.y = procanvas.height;
        proton.addEmitter(emitter);
        proton.addRenderer(renderer);
        emitterList.push(emitter);
    }

    let customDeadBehaviour = () => {
        return {
            initialize: function (particle) { },
            applyBehaviour: function (particle) {
                if (particle.p.y + particle.radius >= procanvas.height) {
                    if (particle.radius > 9) {
                        miniEmitteing(particle);
                        particle.dead = true;
                    }
                }
            }
        }
    }

    let emit = (instr) => {
        emitterList[instr].emit('once');
    }

    let animate = () => {
        requestAnimationFrame(animate);
        proton.update();
    }

    let initParticles = () => {
        procanvas.width = window.innerWidth;
        procanvas.height = 400;
        renderer.onProtonUpdate = function () {
            context.fillStyle = 'black';
            context.fillRect(0, 0, procanvas.width, procanvas.height);
        };

        for (let i = 0; i < 7; i++) {
            initEmitter(i);
        }
        animate();
    }

    // MAIN FUNCTION
    let initJS = () => {
        initSetlist();
        drawMeasure();
        initRects();
        drawVerticalPrev();
        drawInstruments();
        initParticles();
    }

    document.addEventListener("DOMContentLoaded", initJS());

})();