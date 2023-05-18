import * as THREE from 'three';
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import fragment_loading from './shaders/fragment_loading.glsl?raw'
import vertex_loading from './shaders/vertex_loading.glsl?raw'
import fragment_text from './shaders/fragment_text.glsl?raw'
import fragment_img from './shaders/fragment_img.glsl?raw'
import vertex_img from './shaders/vertex_img.glsl?raw'
import vertex_text from './shaders/vertex_text.glsl?raw'
import { MSDFTextGeometry, MSDFTextMaterial, uniforms } from "three-msdf-text-utils";
import fnt from './fonts/BebasNeue-Regular-msdf.json'
import fontTexture from './fonts/BebasNeue-Regular.png'
import iTexture from './pics/studio.jpg'
import ASScroll from '@ashthornton/asscroll'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { LoadingManager } from 'three';
import { gsap } from 'gsap';
// import { ScrollTrigger } from "gsap/ScrollTrigger";


// const createInputEvents = require('simple-input-events');

// create input events with a target element
// const event = createInputEvents(window);

let areas = [...document.querySelectorAll('.snap')]
let obj = { a: 0 }

const TEXTS = [
    'CGI',
    'WebGl',
    'Modeling',
    'UX/UI',
]

export default class Sketch {
    constructor(options) {
        this.container = options.domElement;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.cameraDistance = 300
        this.camera = new THREE.PerspectiveCamera(30, this.width / this.height);
        this.camera.position.z = this.cameraDistance
        this.camera.fov = 2 * Math.atan((this.height / 2) / this.cameraDistance) * 180 / Math.PI  //Pixel = WebGL Units

        this.targetSpeed = 0
        this.scrollIndex = 0
        this.mouse = new THREE.Vector2();
        this.prevMouse = new THREE.Vector2();
        this.followMouse = new THREE.Vector2();


        //Scroll
        this.asscroll = new ASScroll({
            disableRaf: true,
            // touchScrollType: 'scrollTop'
        })

        window.addEventListener('load', () => {
            this.asscroll.enable({
                // horizontalScroll: true
            })
        })

        gsap.to(obj, {
            a: 1,
            scrollTrigger: {
                trigger: '.content',
                markers: false,
                scrub: true,
                start: 'top top',
                end: 'bottom bottom',
                // scroller: '500px',
                // snap: 1 / (areas.length - 1),
            },
        })

        this.loadingManager = new THREE.LoadingManager(
            () => {
                console.log('loaded');
                gsap.to(this.overlayMaterial, { duration: 3, opacity: 0 })

            },
            () => {
                console.log('progress');
            },
            () => {
                console.log('error');
            },
        )

        this.targetPos = 0
        this.imgDistance = 0

        this.scenePost = new THREE.Scene();
        this.scene = new THREE.Scene();
        this.group = new THREE.Group()
        this.scene.add(this.group)


        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        // this.renderer.setPixelRatio(2);
        this.renderer.setClearColor(0x101010)
        this.container.appendChild(this.renderer.domElement);
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.materials = []

        // this.timer = 0;
        // this.scaleFaktor = 0;

        this.createText()
        this.loadObjects()
        this.mouseEvent()
        this.addObj()
        this.settings()
        this.setImages()
        this.setImgPosititon()
        // this.createText()
        this.setupResize()
        this.setupPost()
        this.resize()
        this.render();

    }

    settings() {
        // this.settings = {
        //     progress: 0,
        // }
        // this.gui = new GUI()
        // this.gui.add(this.settings, 'progress', 0, 1, 0.0001)
    }



    createText() {
        this.text = null
        const that = this
        this.textArray = []
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            defines: {
                IS_SMALL: false,
            },
            extensions: {
                derivatives: true,
            },
            uniforms: {
                uAlpha: { value: 0 },
                // Common
                ...uniforms.common,

                // Rendering
                ...uniforms.rendering,

                // Strokes
                ...uniforms.strokes,
            },
            vertexShader: vertex_text,
            fragmentShader: fragment_text
        });
        Promise.all([
            loadFontAtlas(fontTexture)
        ]).then(([atlas]) => {
            this.textSize = this.width / 2
            this.material.uniforms.uMap.value = atlas;
            this.material.uniforms.uAlpha.value = 0.1;
            for (let t = 0; t < TEXTS.length; t++) {
                this.geometry = new MSDFTextGeometry({
                    text: TEXTS[t].toLocaleUpperCase(),
                    font: fnt,
                    align: 'center'
                });

                this.text = new THREE.Mesh(this.geometry, this.material.clone());
                this.scaleFaktor = this.width / 400
                // console.log(this.scaleFaktor);
                this.text.position.x = (-this.geometry.layout.width / 2 * this.scaleFaktor) + this.textSize * t;
                this.text.position.y = (-this.geometry.layout.height / 2 * this.scaleFaktor)
                this.text.scale.set(this.scaleFaktor, -this.scaleFaktor, this.scaleFaktor)
                // this.textArray.push(this.text)
                this.group.add(this.text)
                if (this.group.children.length > 0) this.group.children[0].material.uniforms.uAlpha.value = 1.0
                // this.text.position.x = (-this.geometry.layout.width / 2 * this.scaleFaktor); //Align
            }

        });

        function loadFontAtlas(path) {
            const promise = new Promise((resolve, reject) => {
                const loader = new THREE.TextureLoader(that.loadingManager);
                loader.load(path, resolve);
            });
            return promise;
        }
        // this.text.position.x = -this.geometry.layout.width / 2 * this.scaleFaktor; //Align
    }


    loadObjects() {
        //Loading Screen
        this.overlayGeometry = new THREE.PlaneGeometry(4000, 3000, 1, 1)
        this.overlayMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            color: 0x000000,
            opacity: 1
        })
        this.overlay = new THREE.Mesh(this.overlayGeometry, this.overlayMaterial)
        this.overlay.position.z = 2
        this.scene.add(this.overlay)

    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.fov = 2 * Math.atan((this.height / 2) / this.cameraDistance) * 180 / Math.PI
        this.materials.forEach(m => {
            // m.uniforms.uResolution.value.x = this.width
            // m.uniforms.uResolution.value.y = this.height
        })
        this.imageStore.forEach(item => {
            let info = item.img.getBoundingClientRect()
            item.mesh.scale.set(info.width, info.height, 1)
            item.imgTop = info.top
            item.imgLeft = info.left + this.asscroll.currentPos
            item.imgWidth = info.width
            item.imgHeight = info.height
        })

        for (let i = 0; i < this.group.children.length; i++) {
            this.scaleFaktor = this.width / 400
            this.textSize = this.width / 2
            this.group.children[i].scale.set(this.scaleFaktor, -this.scaleFaktor, this.scaleFaktor)
            // console.log(this.group.children[i].geometry.layout.width);
            this.group.children[i].position.y = (-this.group.children[i].geometry.layout.width / 2 * this.scaleFaktor)
            this.group.children[i].position.x = (-this.group.children[i].geometry.layout.width / 2 * this.scaleFaktor) + this.textSize * i;

        }

        // this.textSize = this.width / 7
        // console.log(this.group.children[0].material);
        this.imgDistance = this.imageStore[1].imgTop - this.imageStore[0].imgTop
        this.targetPos = this.imgDistance
        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
        this.camera.updateProjectionMatrix();


    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }



    TextScroll() {
        // this.imgDistance = this.imageStore[1].imgLeft - this.imageStore[0].imgLeft
        this.textSpeed = -this.asscroll.currentPos * (this.textSize / this.imgDistance)
        // this.textSpeed = -this.asscroll.currentPos 
        this.group.position.x = this.textSpeed

        // this.targetPos = this.targetPos + this.imgDistance
        // console.log(this.targetPos);
        // console.log(this.asscroll.currentPos);

        if (this.asscroll.currentPos > this.targetPos + 200) {
            this.targetPos = this.targetPos + this.imgDistance
            this.scrollIndex += 1
        }
        if (this.asscroll.currentPos - this.imgDistance + 200 < this.targetPos) {
            this.targetPos = this.targetPos - this.imgDistance
            if (this.scrollIndex > 0) this.scrollIndex -= 1
        }

        // if (this.asscroll.currentPos < this.imgDistance)

        this.group.children.forEach((mesh, i) => {
            if (i !== this.scrollIndex) {
                mesh.material.uniforms.uAlpha.value = 0.1;
            } else {
                mesh.material.uniforms.uAlpha.value = 0.8;
            }
        })
    }

    setupPost() {

        this.clearPass = new ClearPass()

        this.composer = new EffectComposer(this.renderer);
        let renderPass1 = new RenderPass(this.scenePost, this.camera)
        renderPass1.clear = false

        let renderPass2 = new RenderPass(this.scene, this.camera)
        renderPass2.clear = false
        // this.renderPass = new RenderPass(this.scene, this.camera);
        // rendering our scene with an image

        const film = new FilmPass(0.35, 0.5, 648, 0)

        this.fxaaPass = new ShaderPass(FXAAShader); // for Anitalising
        this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.container.offsetWidth * window.devicePixelRatio);
        this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.container.offsetHeight * window.devicePixelRatio);



        this.myEffect = {
            uniforms: {
                "tDiffuse": { value: null },
                "resolution": { value: new THREE.Vector2(1., this.height / this.width) },
                "uMouse": { value: new THREE.Vector2(-10, -10) },
                "uVelo": { value: 0 },
            },
            vertexShader: vertex_img,
            fragmentShader: fragment_img
        }

        // our custom shader pass for the whole screen, to displace previous render
        this.customPass = new ShaderPass(this.myEffect);
        // making sure we are rendering it.
        this.customPass.renderToScreen = true;

        let outputPass = new ShaderPass(CopyShader)
        outputPass.renderToScreen = true

        this.composer.addPass(this.clearPass)
        // this.composer.addPass(film);
        this.composer.addPass(renderPass1)
        // this.composer.addPass(this.customPass);
        this.composer.addPass(renderPass2)
        this.composer.addPass(this.customPass);
        this.composer.addPass(this.fxaaPass)
        this.composer.addPass(outputPass)
        // console.log(this.composer.passes);
    }

    addObj() {

        // let TEXTURE = new THREE.TextureLoader().load(iTexture);
        let testgeo = new THREE.PlaneGeometry(109, 190, 1, 1)
        let testmar = new THREE.MeshBasicMaterial({
            color: 0xffffff
        })
        let test = new THREE.Mesh(testgeo, testmar)
        // this.scene.add(test)
        // test.position.z = 10
    }

    setImages() {
        this.allImages = [...document.querySelectorAll('.pics')]
        this.imgShaderMat = new THREE.MeshBasicMaterial({
            map: 0
        });

        this.imageStore = this.allImages.map(img => {

            let imgInfo = img.getBoundingClientRect()
            this.imageGeometry = new THREE.PlaneGeometry(1, 1, 1, 1)
            let m = this.imgShaderMat.clone()

            m.map = new THREE.TextureLoader(this.loadingManager).load(img.src);
            m.map.needsUpdate = true

            this.materials.push(m)
            let mesh = new THREE.Mesh(this.imageGeometry, m)
            this.scenePost.add(mesh)
            mesh.scale.set(imgInfo.width, imgInfo.height, 1)

            return {
                img: img,
                mesh: mesh,
                imgWidth: imgInfo.width,
                imgHeight: imgInfo.height,
                imgTop: imgInfo.top,
                imgLeft: imgInfo.left,
                imgInfo: imgInfo
            }
        })

    }

    setImgPosititon() {
        this.imageStore.forEach(obj => {
            // Horizontal Scroll
            // obj.mesh.position.x = -this.asscroll.currentPos + obj.imgLeft - this.width / 2 + obj.imgWidth / 2

            // obj.mesh.position.y = - obj.imgTop + this.height / 2 - obj.imgHeight / 2

            // Vertikal Scroll
            obj.mesh.position.x = obj.imgLeft - this.width / 2 + obj.imgWidth / 2

            obj.mesh.position.y = this.asscroll.currentPos - obj.imgTop + this.height / 2 - obj.imgHeight / 2
        })
    }


    mouseEvent() {

        document.addEventListener('mousemove', (e) => {
            // mousemove / touchmove
            this.mouse.x = (e.clientX / window.innerWidth);
            this.mouse.y = 1. - (e.clientY / window.innerHeight);
            // console.log(this.mouse);
        });
    }

    getSpeed() {
        this.speed = Math.sqrt((this.prevMouse.x - this.mouse.x) ** 2 + (this.prevMouse.y - this.mouse.y) ** 2);

        this.targetSpeed -= 0.1 * (this.targetSpeed - this.speed);
        this.followMouse.x -= 0.1 * (this.followMouse.x - this.mouse.x);
        this.followMouse.y -= 0.1 * (this.followMouse.y - this.mouse.y);


        this.prevMouse.x = this.mouse.x;
        this.prevMouse.y = this.mouse.y;
    }

    setSafari() {
        window.addEventListener('scroll', (event) => {
            event.preventDefault()
        })
    }


    render() {
        // this.controls.update()
        this.timer += 0.02
        this.customPass.uniforms.uMouse.value = this.mouse;
        this.getSpeed()
        this.customPass.material.uniforms.uVelo.value = Math.min(this.targetSpeed, 0.05)
        this.targetSpeed *= 0.999;
        // console.log(this.asscroll.currentPos);
        // this.customPass.material = this.speed
        // console.log(this.myEffect.uniforms.uVelo.value);
        // this.imageStore[0].mesh.material.uniforms.progress.value = this.settings.progress

        this.setImgPosititon()
        this.asscroll.update()
        this.TextScroll()
        // this.renderer.render(this.scene, this.camera);
        this.composer.render()
        requestAnimationFrame(this.render.bind(this))
    }

}


