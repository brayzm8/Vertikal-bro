import Sketch from './new'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger);


// const myName = new SplitType('#my-name')
// gsap.to('.char', {
//     y: 0,
//     stagger: 0.05,
//     delay: 0.5,
//     duration: .1
// })

// let areas = [...document.querySelectorAll('.snap')]
// console.log(areas);

// titles.forEach(title => {
//     let myTitles = new SplitType(title, 'div', { types: 'chars' })
//     gsap.to(myTitles.chars, {
//         scrollTrigger: {
//             trigger: title,
//             markers: true,
//             end: 'top 165px',
//             scrub: 1,
//             toggleActions: 'restart pause reverse pause'
//         },
//         y: 0,
//         stagger: 0.0,
//         scale: 1,
//         duration: 0.05,
//         autoAlpha: 1,
//     })
// })


new Sketch({
    domElement: document.getElementById('container')
})



// let obj = { a: 0 }
// gsap.to(obj, {
//     a: 1,
//     scrollTrigger: {
//         trigger: '.content',
//         markers: true,
//         scrub: true,
//         onUpdate: (self) => {
//             console.log(self);
//         },
//         start: 'top top',
//         end: 'bottom bottom',
//         // scroller: '500px',
//         snap: 1 / (areas.length - 1),
//     },
// })
