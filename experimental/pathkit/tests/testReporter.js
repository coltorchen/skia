const REPORT_URL = 'http://localhost:8081/report_gold_data'
// Set this to enforce that the gold server must be up.
// Typically used for debugging.
const fail_on_no_gold = false;

function reportCanvas(canvas, testname) {
    let b64 = canvas.toDataURL('image/png');
    return _report(b64, 'canvas', testname);
}

function reportSVG(svg, testname) {
    // This converts an SVG to a base64 encoded PNG. It basically creates an
    // <img> element that takes the inlined SVG and draws it on a canvas.
    // The trick is we have to wait until the image is loaded, thus the Promise
    // wrapping below.
    let svgStr = svg.outerHTML;
    let tempImg = document.createElement('img');

    let tempCanvas = document.createElement('canvas');
    let canvasCtx = tempCanvas.getContext('2d');
    setCanvasSize(canvasCtx, svg.getAttribute('width'), svg.getAttribute('height'));

    return new Promise(function(resolve, reject) {
        tempImg.onload = () => {
            canvasCtx.drawImage(tempImg, 0, 0);
            let b64 = tempCanvas.toDataURL('image/png');
            _report(b64, 'svg', testname).then(() => {
                resolve();
            });
        };
        tempImg.setAttribute('src', 'data:image/svg+xml;,' + svgStr);
    });
}

// For tests that just do a simple path and return it as a string, wrap it in
// a proper svg and send it off.  Supports fill (nofill means just stroke it).
// This uses the "standard" size of 600x600.
function reportSVGString(svgstr, testname, fillRule='nofill') {
    let newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    newPath.setAttribute('stroke', 'black');
    if (fillRule !== 'nofill') {
        newPath.setAttribute('fill', 'orange');
        newPath.setAttribute('fill-rule', fillRule);
    } else {
        newPath.setAttribute('fill', 'rgba(255,255,255,0.0)');
    }
    newPath.setAttribute('d', svgstr);
    let newSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSVG.appendChild(newPath);
    // helps with the conversion to PNG.
    newSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    newSVG.setAttribute('width', 600);
    newSVG.setAttribute('height', 600);
    return reportSVG(newSVG, testname);
}

function _report(data, outputType, testname) {
    return fetch(REPORT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'output_type': outputType,
            'data': data,
            'test_name': testname,
        })
    }).then(() => console.log(`Successfully reported ${testname} to gold aggregator`));
}

function reportError(done) {
    return (e) => {
        console.log("Error with fetching. Likely could not connect to aggegator server", e.message);
        if (fail_on_no_gold) {
            expect(e).toBeUndefined();
        }
        done();
    };
}

function setCanvasSize(ctx, width, height) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
}

function standardizedCanvasSize(ctx) {
    setCanvasSize(ctx, 600, 600);
}