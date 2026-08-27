import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initGSAP() {
  gsap.utils.toArray(".hero-word").forEach((w, i) => {
    gsap.to(w, { y: 0, opacity: 1, duration: 1.1, delay: 0.4 + i * 0.12, ease: "power4.out" });
  });
  gsap.to(".hero-actions", { y: 0, opacity: 1, duration: 0.9, delay: 1.1, ease: "power3.out" });
  gsap.to(".hero-desc", { y: 0, opacity: 1, duration: 0.9, delay: 1.25, ease: "power3.out" });
  gsap.to(".hero-scroll", { opacity: 1, duration: 0.8, delay: 1.4 });


  gsap.utils.toArray("[data-scroll-speed]").forEach((el) => {
    const speed = parseFloat(el.getAttribute("data-scroll-speed"));
    if (!isNaN(speed)) {
      gsap.to(el, {
        y: () => -(window.innerHeight * speed * 0.1),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        }
      });
    }
  });

  const processWrap = document.querySelector(".process-wrap");
  if (processWrap) {
    const steps = gsap.utils.toArray(".process-step");
    const progressFill = document.querySelector(".process-progress-fill");
    const totalSteps = steps.length;

    gsap.set(steps[0], { opacity: 1, y: 0, zIndex: totalSteps });
    gsap.set(steps[0].querySelector(".step-icon"), { scale: 1, rotate: 0 });
    gsap.set(steps[0].querySelector(".step-line"), { scaleX: 1 });

    steps.forEach((step, i) => {
      if (i > 0) {
        gsap.set(step, { opacity: 0, y: "100%", zIndex: totalSteps + i });
      }
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: processWrap,
        start: "top top",
        end: () => "+=" + (totalSteps * 80) + "%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });

    steps.forEach((step, i) => {
      if (i === 0) {
        if (progressFill) {
          tl.to(progressFill, { scaleY: 1 / totalSteps, duration: 0.3 }, 0);
        }
      }
      if (i > 0) {
        const pos = i * 1.2;
        tl.to(step, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, pos);
        tl.to(step.querySelector(".step-icon"), { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(1.7)" }, pos + 0.2);
        tl.to(step.querySelector(".step-line"), { scaleX: 1, duration: 0.6, ease: "power2.out" }, pos + 0.3);
        if (progressFill) {
          tl.to(progressFill, { scaleY: (i + 1) / totalSteps, duration: 0.8 }, pos);
        }
      }
    });
  }

  gsap.to(".manifesto-big", {
    scrollTrigger: { trigger: ".manifesto", start: "top 70%" },
    opacity: 1,
    x: 0,
    duration: 1,
    ease: "power3.out",
  });
  gsap.utils.toArray(".manifesto-p").forEach((p, i) => {
    gsap.to(p, {
      scrollTrigger: { trigger: p, start: "top 80%" },
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay: i * 0.15,
      ease: "power3.out",
    });
  });
  gsap.utils.toArray(".value-card").forEach((c, i) => {
    gsap.to(c, {
      scrollTrigger: { trigger: c, start: "top 85%" },
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay: i * 0.12,
      ease: "power3.out",
    });
  });
  gsap.utils.toArray(".srv-row").forEach((row, i) => {
    gsap.to(row, {
      scrollTrigger: { trigger: row, start: "top 85%" },
      opacity: 1,
      x: 0,
      duration: 0.6,
      delay: i * 0.08,
      ease: "power3.out",
    });
  });

  const stripeWraps = gsap.utils.toArray(".marquee-transition-wrap");
  stripeWraps.forEach((wrap) => {
    const leftStripe = wrap.querySelector(".marquee-stripe-left");
    const rightStripe = wrap.querySelector(".marquee-stripe-right");

    if (leftStripe && rightStripe) {
      gsap.set(leftStripe, { rotation: -3, y: 45, xPercent: -30 });
      gsap.set(rightStripe, { rotation: 2, y: -45, xPercent: 0 });

      gsap.to(leftStripe, {
        xPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });

      gsap.to(rightStripe, {
        xPercent: -30,
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    }
  });
}
