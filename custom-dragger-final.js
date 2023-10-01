
var Dragger = function(){
    var mainDiv = null;
    var imageContainer = null;
    let counter = 1;
    let handles = null;
    var elements = [];
    var rotating = false;
    var dragging = false;
    var offset = {x:0, y:0}
    var resizing = false;
    var resizeObj = {
        x: 0, y: 0, top: 0, left:0, height:false, width: false, // this is the old coordinates of the center,
        nextX: 0, nextY: 0, // this nextX, nextY are coordinated for the next point on the rectangle clockwise, after the opposite point
    }
    var defaultTools = [
        { name: "Delete", title: "Delete", classes:[ 'btn', 'delete-btn' ], action:(e, item)=>{
            let elemIndex = elements.findIndex( i => i == item )
            if (elemIndex!=-1){
                item.remove()
                elements.splice(elemIndex, 1)
                hidePalette()
                hidehandles()
            }
        } },
        { name: "H-Flip", title: "H-Flip", classes:['btn', 'h-flip-btn' ], action:(e, item)=>{
            let scaleX = item.style.transform.match(/scaleX\((-?\d+\.?\d*)\)/)
            handles.selectedTarget.style.transform = item.style.transform.replace(/scaleX\((-?\d+\.?\d*)\)/, `scaleX(${-scaleX[1]})`)
            hidehandles()
            mouseDownhandler({ ...e, target: item, button: 0, })
            showPalette()
        } }
    ]
    var palette = null;
    var secondaryPalette = null;
    function createContainer(){
        let canvas = document.createElement('div')
        canvas.classList.add('image-drag-canvas')
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        mainDiv.append(canvas)
        return canvas
    }
    function createHandlerDiv(){
        let handles = document.createElement('div');
        handles.style.display = 'none'
        handles.setAttribute('type', 'handle')
        handles.setAttribute('direction', 'drag')
        handles.classList.add('dragger-handle-group')
        let handletl = document.createElement('div')
        handletl.classList.add('dragger-handle','tl')
        handletl.setAttribute('type', 'handle')
        handletl.setAttribute('direction', 'tl')
        handles.append(handletl)
        let handletm = document.createElement('div')
        handletm.classList.add('dragger-handle','tm')
        handletm.setAttribute('type', 'handle')
        handletm.setAttribute('direction', 'tm')
        handles.append(handletm)
        let handletr = document.createElement('div')
        handletr.classList.add('dragger-handle','tr')
        handletr.setAttribute('type', 'handle')
        handletr.setAttribute('direction', 'tr')
        handles.append(handletr)
        let handlelm = document.createElement('div')
        handlelm.classList.add('dragger-handle','lm')
        handlelm.setAttribute('type', 'handle')
        handlelm.setAttribute('direction', 'lm')
        handles.append(handlelm)
        let handlebl = document.createElement('div')
        handlebl.classList.add('dragger-handle','bl')
        handlebl.setAttribute('type', 'handle')
        handlebl.setAttribute('direction', 'bl')
        handles.append(handlebl)
        let handlebr = document.createElement('div')
        handlebr.classList.add('dragger-handle','br')
        handlebr.setAttribute('type', 'handle')
        handlebr.setAttribute('direction', 'br')
        handles.append(handlebr)
        let handlebm = document.createElement('div')
        handlebm.classList.add('dragger-handle','bm')
        handlebm.setAttribute('type', 'handle')
        handlebm.setAttribute('direction', 'bm')
        handles.append(handlebm)
        let handlerm = document.createElement('div')
        handlerm.classList.add('dragger-handle','rm')
        handlerm.setAttribute('type', 'handle')
        handlerm.setAttribute('direction', 'rm')
        handles.append(handlerm)
        let handlerotate = document.createElement('div')
        handlerotate.classList.add('dragger-handle','rotate')
        handlerotate.setAttribute('type', 'handle')
        handlerotate.setAttribute('direction', 'rotate')
        handles.append(handlerotate)
        return handles
    }
    function createPalette(toolList){
        palette = document.createElement('div')
        palette.setAttribute('type', 'palette')
        palette.classList.add('palette')
        for ( let i=0; i<toolList.length; i++ ){
            createTool(toolList[i])
        }
        return palette
    }
    function showPalette(e){
        palette.style.top = '0px'
        palette.style.left = ''
        palette.style.right = '0px'
        palette.style.bottom = ''
        imageContainer.append(palette)
    //     secondaryPalette = palette.cloneNode(true)
    //     secondaryPalette.style.top=""
    //     secondaryPalette.style.left=""
    //     secondaryPalette.style.right="0px"
    //     secondaryPalette.style.bottom="0px"
    //     imageContainer.append(secondaryPalette)
    }
    function hidePalette(){
        palette.remove()
        // secondaryPalette?.remove()
    }

    function createTool(toolItem){
        let btn = document.createElement('button')
        btn.innerHTML = toolItem.name
        btn.setAttribute('type', 'palette')
        btn.setAttribute('title', toolItem.title)
        btn.addEventListener( 'click', (e)=>{ toolItem.action( e, handles.selectedTarget ) } )
        btn.classList.add(...toolItem?.classes)
        palette.append(btn)
    }
    function showHandles(elem){
        handles.selectedTarget = elem
        handles.style.display = 'block'
        handles.style.top = elem.style.top
        handles.style.left = elem.style.left
        handles.style.width = elem.style.width
        handles.style.height = elem.style.height
        // handles.style.transform = elem.style.transform; // adding this will cause issue with the resizing when the div is mirrored
        let angle = handles.selectedTarget.style.transform.match(/rotate\((-?\d+\.?\d*)deg\)/)
        angle = (Number(angle[1])%360 + 360)%360
        let scaleX = handles.selectedTarget.style.transform.match(/scaleX\((-?\d+\.?\d*)\)/)
        let scaleY = handles.selectedTarget.style.transform.match(/scaleY\((-?\d+\.?\d*)\)/)
        handles.style.transform =  `rotate(${angle*(scaleX[1]==scaleY[1]?1:-1)}deg)`;
        imageContainer.append(handles)
    }
    function hidehandles(){
        handles.selectedTarget = null
        handles.remove()
    }
    function rotate(e){
        const rect = imageContainer.getBoundingClientRect();
        let currentCursor = {}
        currentCursor.x = e.clientX - rect.left;
        currentCursor.y = e.clientY - rect.top;
        let objectCenter = {
            x: Number(handles.style.left.split('px')[0])+Number(handles.style.width.split('px')[0])/2,
            y: Number(handles.style.top.split('px')[0])+Number(handles.style.height.split('px')[0])/2,
        }
        let angle = (Math.atan2( currentCursor.y-objectCenter.y, currentCursor.x-objectCenter.x ))*180/Math.PI
        angle+= 90; // this is to offset for browser
        angle = (angle%360+360)%360;  // this is to resolve negative degrees and >360 degrees
        handles.style.transform = handles.style.transform.replace(/rotate\((-?\d+\.?\d*)deg\)/, `rotate(${angle}deg)`)

    }
    function drag(e){
        // when dragging offset hold the coordinated of the relative position of the cursor over the moving object
        const rect = imageContainer.getBoundingClientRect();
        handles.style.top = `${e.clientY-rect.top-offset.y}px`
        handles.style.left = `${e.clientX-rect.left-offset.x}px`

    }
    function resize(e){
        // when resizing, offset hold the coordinates of the opposite handle
        // it right-middle handle is being used to resize then offset hold the coordinates of left-middle handle

        let { angle, rAngle, width, height, top, left } = handles.selectedTarget
        let newTop = top;
        let newLeft = left;
        let newHeight = height;
        let newWidth = width;

        const rect = imageContainer.getBoundingClientRect();
        let currentCursor = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }; //current position of cursor
        let newPos = { x: NaN, y: NaN }; // this will hold the new position of the handle that was used to drag.
        
        let slopeP1 = Math.tan(rAngle)
        let slopeP2 = -1/slopeP1
        let roundedOffAngle = Math.abs( Math.round(angle*100)/100 )

        // let d1 = Math.sqrt( (currentCursor.x-newPos.x)**2 + (currentCursor.y-newPos.y)**2 ); // distance of currentCursor from newPos
        // let d2 = Math.sqrt( (offset.x-newPos.x)**2 + (offset.y-newPos.y)**2 ); // distance of offset from current pos

        // this is to calculate the new Width or height

        if ( resizeObj.width && resizeObj.height ){
            function getOffsetAngle(p1, p2, p3){

                const vectorP2P3 = { x: p3.x - p2.x, y: p3.y - p2.y };
                const vectorP2P1 = { x: p1.x - p2.x, y: p1.y - p2.y };

                // Calculate the dot product of the vectors
                const dotProduct = vectorP2P3.x * vectorP2P1.x + vectorP2P3.y * vectorP2P1.y;

                // Calculate the magnitudes (lengths) of the vectors
                const magnitudeP2P3 = Math.sqrt(vectorP2P3.x ** 2 + vectorP2P3.y ** 2);
                const magnitudeP2P1 = Math.sqrt(vectorP2P1.x ** 2 + vectorP2P1.y ** 2);

                // Calculate the angle θ in radians
                let theta = Math.acos(dotProduct / (magnitudeP2P3 * magnitudeP2P1));

                // Calculate the cross product of the vectors
                const crossProduct = vectorP2P3.x * vectorP2P1.y - vectorP2P3.y * vectorP2P1.x;

                // Check the sign of the cross product to determine the direction
                if (crossProduct < 0) {
                    theta = 2 * Math.PI - theta; // Reverse the angle for counterclockwise direction
                }

                // Calculate the angle in degrees
                return angleDegrees = (theta * 180 / Math.PI);
                
            }
            function getPerpendicular(p1, p2, p3){
                let slopeP1 = (p2.y - p1.y)/(p2.x - p1.x)
                let slopeP2 = -1/slopeP1
                slopeP2 = Math.round( slopeP2*1000 )/1000
                let p4 = { x: NaN, y: NaN }
                if (slopeP1 == 0){
                    p4.x = p3.x
                    p4.y = offset.y
                }
                else if (slopeP2 == 0){
                    p4.x = offset.x
                    p4.y = p3.y
                }
                else{
                    p4.x = (p3.y - p1.y + slopeP1*p1.x - slopeP2*p3.x)/(slopeP1 - slopeP2);
                    p4.y = offset.y + slopeP1*p4.x - slopeP1*p1.x
                }
                return p4
            }
            let offsetAngle = getOffsetAngle( offset, resizeObj, currentCursor )
            offsetAngle = Math.abs( Math.round( offsetAngle*100 )/100 )
            let secondPoint = { x: resizeObj.nextX, y: resizeObj.nextY }
            let perpendicularPoint = getPerpendicular(offset, secondPoint, currentCursor)
            let d1 = Math.sqrt( ( offset.y-perpendicularPoint.y )**2 + (offset.x - perpendicularPoint.x)**2 )
            let d2 = Math.sqrt( ( currentCursor.y-perpendicularPoint.y )**2 + (currentCursor.x-perpendicularPoint.x)**2 )

            if (resizeObj.nextDirection == 'br'){
                if (offsetAngle >= 0 && offsetAngle <=180){
                    newHeight = d2;
                    newWidth = newHeight*width/height
                }else{
                    newWidth = d1;
                    newHeight = newWidth*height/width;
                }
                newPos.x = offset.x + Math.sqrt( newHeight**2 + newWidth**2 )*Math.cos( rAngle + Math.atan(height/width) )
                newPos.y = offset.y + Math.sqrt( newHeight**2 + newWidth**2 )*Math.sin( rAngle + Math.atan(height/width) )

            }
            else if (resizeObj.nextDirection == 'bl'){
                if (offsetAngle >= 0 && offsetAngle <=180){
                    newWidth = d2;
                    newHeight = newWidth*height/width;
                }else{
                    newHeight = d1;
                    newWidth = newHeight*width/height
                }
                newPos.x = offset.x - Math.sqrt( newHeight**2 + newWidth**2 )*Math.cos( rAngle - Math.atan(height/width) )
                newPos.y = offset.y - Math.sqrt( newHeight**2 + newWidth**2 )*Math.sin( rAngle - Math.atan(height/width) )
            }
            else if (resizeObj.nextDirection == 'tl'){
                if (offsetAngle >= 0 && offsetAngle <=180){
                    newHeight = d2;
                    newWidth = newHeight*width/height
                }else{
                    newWidth = d1;
                    newHeight = newWidth*height/width;
                }
                newPos.x = offset.x - Math.sqrt( newHeight**2 + newWidth**2 )*Math.cos( rAngle + Math.atan(height/width) )
                newPos.y = offset.y - Math.sqrt( newHeight**2 + newWidth**2 )*Math.sin( rAngle + Math.atan(height/width) )
            }
            else if (resizeObj.nextDirection == 'tr'){
                if (offsetAngle >= 0 && offsetAngle <=180){
                    newWidth = d2;
                    newHeight = newWidth*height/width;
                }else{
                    newHeight = d1;
                    newWidth = newHeight*width/height
                }
                newPos.x = offset.x + Math.sqrt( newHeight**2 + newWidth**2 )*Math.cos( rAngle - Math.atan(height/width) )
                newPos.y = offset.y + Math.sqrt( newHeight**2 + newWidth**2 )*Math.sin( rAngle - Math.atan(height/width) )
            }

        }else {

            if (roundedOffAngle==0 || roundedOffAngle==360 || roundedOffAngle==180){
                if (resizeObj.width){
                    newPos.x = currentCursor.x
                    newPos.y = offset.y
                }else{
                    newPos.x = offset.x
                    newPos.y = currentCursor.y
                }
            }
            else if(roundedOffAngle==90 || roundedOffAngle==270){
                if (resizeObj.width){
                    newPos.x = offset.x
                    newPos.y = currentCursor.y
                }else{
                    newPos.x = currentCursor.x
                    newPos.y = offset.y
                }
            }
            else{
                if ( resizeObj.height ){
                    slopeP1 = slopeP2
                    slopeP2 = -1/slopeP1
                }
                newPos.x= ( currentCursor.y - offset.y + (slopeP1 * offset.x) - (slopeP2 * currentCursor.x)) / (slopeP1-slopeP2)
                newPos.y = slopeP1*( newPos.x - offset.x ) + offset.y
            }

            let d1 = Math.sqrt( (offset.x-newPos.x)**2 + (offset.y-newPos.y)**2 ); // distance of offset from newPos
            if (resizeObj.width) newWidth = d1;
            else newHeight = d1;

        }

        // this is tp calculate the new top and left
        newLeft = ( offset.x +newPos.x )/2 - newWidth/2;
        newTop = (offset.y +newPos.y)/2 - newHeight/2;


        
        handles.style.top = `${newTop}px`
        handles.style.left = `${newLeft}px`
        handles.style.width = `${newWidth}px`
        handles.style.height = `${newHeight}px`

    }

    function mouseDownhandler(e){
        if (e.target.getAttribute('type')=='palette') return
        hidePalette()
        
        const rect = imageContainer.getBoundingClientRect();
        let currentCursor = {}
        currentCursor.x = e.clientX - rect.left;
        currentCursor.y = e.clientY - rect.top;
        if (e.button!=0){
            mouseUpHandler(e)
            return
        }
        if (e.target.getAttribute('type')=='handle'){
            offset.x = currentCursor.x - Number(e.target.style.left.split('px')[0])
            offset.y = currentCursor.y - Number(e.target.style.top.split('px')[0])
            resizeObj.x = Number(handles.style.left.split('px')[0])+(Number(handles.style.width.split('px')[0]))/2
            resizeObj.y = Number(handles.style.top.split('px')[0])+(Number(handles.style.height.split('px')[0]))/2
            resizeObj.top = Number(handles.style.top.split('px')[0])
            resizeObj.left = Number(handles.style.left.split('px')[0])
            
            let angle = handles.selectedTarget.style.transform.match(/rotate\((-?\d+\.?\d*)deg\)/)
            let scaleX = handles.selectedTarget.style.transform.match(/scaleX\((-?\d+\.?\d*)\)/)
            let scaleY = handles.selectedTarget.style.transform.match(/scaleY\((-?\d+\.?\d*)\)/)
            handles.selectedTarget.actualAngle =  (Number(angle[1])%360 + 360)%360;
            handles.selectedTarget.scaleX = scaleX[1]
            handles.selectedTarget.scaleY = scaleY[1]
            handles.selectedTarget.angle =  ( scaleX[1]==scaleY[1] )?handles.selectedTarget.actualAngle:(-handles.selectedTarget.actualAngle)
            handles.selectedTarget.rAngle = (handles.selectedTarget.angle * Math.PI) / 180
            handles.selectedTarget.top =  Number( handles.selectedTarget.style.top.split('px')[0] )
            handles.selectedTarget.left =  Number( handles.selectedTarget.style.left.split('px')[0] )
            handles.selectedTarget.width =  Number( handles.selectedTarget.style.width.split('px')[0] )
            handles.selectedTarget.height =  Number( handles.selectedTarget.style.height.split('px')[0] )
            let { top, left, height, width, rAngle } =  handles.selectedTarget
            if (e.target.getAttribute('direction')=='rotate'){
                rotating = true;
                return
            }
            if (e.target.getAttribute('direction')=='drag'){
                dragging = true;
                return
            }
            if (e.target.getAttribute('direction')=='rm'){
                resizing=true;
                resizeObj.width = true
                resizeObj.height = false
                // offset holds the coordinate of the rotated left-middle handle
                offset.x = left+(width/2) - (width/2)*Math.cos( rAngle ) 
                offset.y = top+(height/2) - (width/2)*Math.sin( rAngle )
                return
            }
            if (e.target.getAttribute('direction')=='bm'){
                resizing=true;
                resizeObj.width = false
                resizeObj.height = true
                // offset holds the coordinate of the coordinate of the rotated top-middle handle
                offset.x = left+(width/2) + (height/2)*Math.sin( rAngle ) 
                offset.y = top+(height/2) - (height/2)*Math.cos( rAngle )
                return
            }
            if (e.target.getAttribute('direction')=='lm'){
                resizing=true;
                resizeObj.width = true
                resizeObj.height = false
                // offset holds the coordinate of the coordinate of the rotated right-middle handle
                offset.x = left+(width/2) + (width/2)*Math.cos( rAngle ) 
                offset.y = top+(height/2) + (width/2)*Math.sin( rAngle )
                return
            }
            if (e.target.getAttribute('direction')=='tm'){
                resizing=true;
                resizeObj.width = false
                resizeObj.height = true
                // offset holds the coordinate of the coordinate of the rotated bottom-middle handle
                offset.x = left+(width/2) - (height/2)*Math.sin( rAngle ) 
                offset.y = top+(height/2) + (height/2)*Math.cos( rAngle )
                return
            }
            if (e.target.getAttribute('direction')=='br'){
                resizing=true;
                resizeObj.width = true
                resizeObj.height = true
                // offset holds the coordinate of the coordinate of the rotated top-left handle
                offset.x = left+(width/2) - Math.sqrt((height**2)+(width**2)) * Math.cos( rAngle + Math.atan(height/width) )/2
                offset.y = top+(height/2) - Math.sqrt((height**2)+(width**2)) * Math.sin( rAngle + Math.atan(height/width) )/2
                
                resizeObj.nextX = offset.x + width*Math.cos(rAngle)
                resizeObj.nextY = offset.y + width*Math.sin(rAngle)
                resizeObj.nextDirection = 'br'
                return
            }
            if (e.target.getAttribute('direction')=='bl'){
                resizing=true;
                resizeObj.width = true
                resizeObj.height = true
                // offset holds the coordinate of the coordinate of the rotated top-right handle
                offset.x = left+(width/2) + Math.sqrt((height**2)+(width**2)) * Math.cos( rAngle - Math.atan(height/width) )/2
                offset.y = top+(height/2) + Math.sqrt((height**2)+(width**2)) * Math.sin( rAngle - Math.atan(height/width) )/2

                resizeObj.nextX = offset.x - height*Math.sin(rAngle)
                resizeObj.nextY = offset.y + height*Math.cos(rAngle)
                resizeObj.nextDirection = 'bl'
                return
            }
            if (e.target.getAttribute('direction')=='tl'){
                    resizing=true;
                resizeObj.width = true
                resizeObj.height = true
                // offset holds the coordinate of the coordinate of the rotated top-right handle
                offset.x = left+(width/2) + Math.sqrt((height**2)+(width**2)) * Math.cos( rAngle + Math.atan(height/width) )/2
                offset.y = top+(height/2) + Math.sqrt((height**2)+(width**2)) * Math.sin( rAngle + Math.atan(height/width) )/2
                
                resizeObj.nextX = offset.x - width*Math.cos(rAngle)
                resizeObj.nextY = offset.y - width*Math.sin(rAngle)
                resizeObj.nextDirection = 'tl'
                return
            }
            if (e.target.getAttribute('direction')=='tr'){
                resizing=true;
                resizeObj.width = true
                resizeObj.height = true
                // offset holds the coordinate of the coordinate of the rotated top-left handle
                offset.x = left+(width/2) - Math.sqrt((height**2)+(width**2)) * Math.cos( rAngle - Math.atan(height/width) )/2
                offset.y = top+(height/2) - Math.sqrt((height**2)+(width**2)) * Math.sin( rAngle - Math.atan(height/width) )/2

                resizeObj.nextX = offset.x + height*Math.sin(rAngle)
                resizeObj.nextY = offset.y - height*Math.cos(rAngle)
                resizeObj.nextDirection = 'tr'
                return
            }
        }else{
            if (e.target.getAttribute('type')=='movable') showHandles(e.target)
            else hidehandles()
        }
    }
    function mouseUpHandler(e){
        if (e.button!=0) return
        if (handles.selectedTarget){
            if (rotating){
                let { scaleX, scaleY } = handles.selectedTarget;
                let newAngle = handles.style.transform.match(/rotate\((-?\d+\.?\d*)deg\)/)
                newAngle = (scaleX==scaleY)?newAngle[1]:(-newAngle[1])
                let newTransform = `scaleX(${scaleX}) scaleY(${scaleY}) rotate(${newAngle}deg)`
                handles.selectedTarget.style.transform = newTransform
            }
            if (dragging){
                handles.selectedTarget.style.top = handles.style.top
                handles.selectedTarget.style.left = handles.style.left
            }
            if (resizing){
                handles.selectedTarget.style.top = handles.style.top
                handles.selectedTarget.style.left = handles.style.left
                handles.selectedTarget.style.width = handles.style.width
                handles.selectedTarget.style.height = handles.style.height
            }
            rotating = false
            dragging = false
            resizing = false
        }
        
    }
    function mouseMoveHandler(e){
        if (e.buttons!=1) return ; // move should only be handled when the left is pressed
        if (rotating){ rotate(e); return; }
        if (dragging){ drag(e); return; }
        if (resizing){ resize(e); return; }
    }

    function cursorLocator(e){
        const rect = imageContainer.getBoundingClientRect();
        let currentCursor = {}
        currentCursor.x = e.clientX - rect.left;
        currentCursor.y = e.clientY - rect.top;
    }

    return {
        mount(c){
            mainDiv = document.getElementById(c.containerId)
            imageContainer = createContainer()
            handles = createHandlerDiv()
            createPalette(defaultTools)
            imageContainer.addEventListener('mousedown', mouseDownhandler)
            document.addEventListener('mouseup', mouseUpHandler)
            document.addEventListener('mousemove', mouseMoveHandler)
            document.addEventListener('dblclick', showPalette )
            document.addEventListener('wheel', cursorLocator)
        },
        unMount(){

            imageContainer.removeEventListener('mousedown', mouseDownhandler)
            document.removeEventListener('mouseup', mouseUpHandler)
            document.removeEventListener('mousemove', mouseMoveHandler)
            document.removeEventListener('dblclick', showPalette )
            document.removeEventListener('wheel', cursorLocator)
        },
        addElement(elem){
            let domElem = document.createElement(elem.tagName)
            domElem.setAttribute('id', `item_${counter++}`)

            let keys = Object.keys(elem.attributes)
            for (let i=0; i<keys.length; i++){
                if (keys[i] =='class'){
                    domElem.classList.add(...elem.attributes['class'])
                }else{
                    domElem.setAttribute( keys[i], elem.attributes[keys[i]] )
                }
            }

            if (elem.innerHTML) domElem.innerHTML = elem.innerHTML
            domElem.style.position = 'absolute'
            domElem.style.width = `${imageContainer.clientWidth*elem.dimension.width}px`
            domElem.style.height = `${imageContainer.clientHeight*elem.dimension.height}px`
            domElem.style.top = `${imageContainer.clientHeight*elem.position.top}px`
            domElem.style.left = `${imageContainer.clientWidth*elem.position.left}px`
            domElem.style.transform = `scaleX(${elem.transform.xflip?-1:1}) scaleY(${elem.transform.yflip?-1:1}) rotate(${elem.transform.rotate?elem.transform.rotate:0}deg)`

            domElem.setAttribute( 'draggable', 'false')
            elements.push(domElem)
            imageContainer.append(domElem)

        },
        addElements(elemList){
            for (let i=0; i<elemList.length; i++) this.addElement(elemList[i])
        }
    }
}