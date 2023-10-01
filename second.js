let draggerObj = new Dragger()

draggerObj.mount({ containerId: "image-drag-container" })

let elements = [
    {
        "innerHTML": "Type your description here",
        "tagName" : "div",
        "name" : "Description",
        "dimension" : {
            "width" : 0.4,
            "height" : 0.1
        },
        "position" : {
            "top" : 0.1,
            "left" : 0.5
        },
        "transform":{
            "xflip": false,
            "yflip": false,
            "rotate": 26, // in degrees
        },
        "attributes" : {
            "type" : "movable",
            "class" : [ 
                "movable-obj"
            ],
        },
        "_id" : "6512a9551c0bb5848a490708"
    },
    
    {
        "tagName" : "img",
        "name" : "Arrow",
        "dimension" : {
            "width" : 0.2,
            "height" : 0.2
        },
        "position" : {
            "top" : 0.6,
            "left" : 0.4
        },
        "transform":{
            "xflip": true,
            "yflip": false,
            "rotate": 20, // in degrees
        },
        "attributes" : {
            "type" : "movable",
            "class" : [ 
                "movable-obj"
            ],
            "src" : "./arrow.svg"
        },
        "_id" : "6512a9551c0bb5848a490708"
    }
]

draggerObj.addElements(elements)