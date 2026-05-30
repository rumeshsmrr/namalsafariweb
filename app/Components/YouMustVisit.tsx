"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useEffect } from "react";
import { IoLocationSharp } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface parksItem {
  id: number;
  img: string;
  title: string;
  link: string;
  pinColor: string;
  rating?: string;
}

function YouMustVisit() {
  // Refs for GSAP animations
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLHRElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const youmust: parksItem[] = [
    {
      id: 1,
      img: "/Images/popular1.webp",
      title: "Yala National Park Safari",
      link: "/parks/yala",
      pinColor: "text-[#0288D1]",
      rating: "4.2",
    },
    {
      id: 2,
      img: "/Images/gallery3.webp",
      title: "Udawalawa National Park Safari",
      link: "/parks/udawalawa",
      pinColor: "text-[#FFEA00]",
      rating: "4.5",
    },
    {
      id: 3,
      img: "/Images/popular3.webp",
      title: "Bundala Nation Park Safari",
      link: "/parks/bundala",
      pinColor: "text-[#0F9D58]",
      rating: "4.5",
    },
    {
      id: 4,
      img: "/Images/lunuganSmall.webp",
      title: "Lunugamwehera Nation Park Safari",
      link: "/parks/lunugamwehera",
      pinColor: "text-[#FF5252]",
      rating: "4.2",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation timeline
      const headerTl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          end: "bottom 60%",
          toggleActions: "play none none reverse",
        },
      });

      // Animate line width and opacity
      headerTl.fromTo(
        lineRef.current,
        {
          width: 0,
          opacity: 0,
        },
        {
          width: "10%",
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        }
      );

      // Animate title
      headerTl.fromTo(
        titleRef.current,
        {
          opacity: 0,
          y: 30,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      );

      // Map animation
      gsap.fromTo(
        mapRef.current,
        {
          opacity: 0,
          x: -50,
          scale: 0.95,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mapRef.current,
            start: "top 80%",
            end: "bottom 60%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Cards animation with stagger
      cardRefs.current.forEach((card, index) => {
        if (card) {
          const cardImage = card.querySelector(".card-image");
          const cardOverlay = card.querySelector(".card-overlay");
          const cardTitle = card.querySelector(".card-title");
          const cardPin = card.querySelector(".card-pin");
          const cardRating = card.querySelector(".card-rating");

          // Initial card animation
          gsap.fromTo(
            card,
            {
              opacity: 0,
              y: 50,
              scale: 0.9,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power2.out",
              delay: index * 0.15,
              scrollTrigger: {
                trigger: cardsContainerRef.current,
                start: "top 80%",
                end: "bottom 60%",
                toggleActions: "play none none reverse",
              },
            }
          );

          // Image scale animation
          if (cardImage) {
            gsap.fromTo(
              cardImage,
              {
                scale: 1.2,
                opacity: 0,
              },
              {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                delay: index * 0.15 + 0.1,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Pin animation
          if (cardPin) {
            gsap.fromTo(
              cardPin,
              {
                opacity: 0,
                scale: 0,
                rotation: -180,
              },
              {
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 0.5,
                ease: "back.out(1.7)",
                delay: index * 0.15 + 0.3,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Rating animation
          if (cardRating) {
            gsap.fromTo(
              cardRating,
              {
                opacity: 0,
                scale: 0,
              },
              {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)",
                delay: index * 0.15 + 0.4,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Overlay animation
          if (cardOverlay) {
            gsap.fromTo(
              cardOverlay,
              {
                opacity: 0,
              },
              {
                opacity: 1,
                duration: 0.4,
                delay: index * 0.15 + 0.2,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Title animation
          if (cardTitle) {
            gsap.fromTo(
              cardTitle,
              {
                opacity: 0,
                y: 30,
              },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                delay: index * 0.15 + 0.5,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Hover animations
          const handleMouseEnter = () => {
            gsap.to(card, {
              scale: 1.05,
              duration: 0.3,
              ease: "power2.out",
            });

            if (cardImage) {
              gsap.to(cardImage, {
                scale: 1.1,
                duration: 0.5,
                ease: "power2.out",
              });
            }

            if (cardPin) {
              gsap.to(cardPin, {
                scale: 1.2,
                rotation: 10,
                duration: 0.3,
                ease: "power2.out",
              });
            }

            if (cardRating) {
              gsap.to(cardRating, {
                scale: 1.1,
                duration: 0.3,
                ease: "power2.out",
              });
            }
          };

          const handleMouseLeave = () => {
            gsap.to(card, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out",
            });

            if (cardImage) {
              gsap.to(cardImage, {
                scale: 1,
                duration: 0.5,
                ease: "power2.out",
              });
            }

            if (cardPin) {
              gsap.to(cardPin, {
                scale: 1,
                rotation: 0,
                duration: 0.3,
                ease: "power2.out",
              });
            }

            if (cardRating) {
              gsap.to(cardRating, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out",
              });
            }
          };

          card.addEventListener("mouseenter", handleMouseEnter);
          card.addEventListener("mouseleave", handleMouseLeave);

          // Cleanup function will handle removing event listeners
          return () => {
            card.removeEventListener("mouseenter", handleMouseEnter);
            card.removeEventListener("mouseleave", handleMouseLeave);
          };
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12 bg-background font-display h-fit block"
    >
      {/* Header Section */}
      <header
        ref={headerRef}
        className="flex flex-row gap-2 sm:gap-3 md:gap-4 items-center mb-6 sm:mb-8 md:mb-10"
      >
        <hr
          ref={lineRef}
          className="w-[15px] sm:w-[25px] md:w-[60px] lg:w-[100px] xl:w-[155px] bg-secondary border-primary"
        />
        <h2
          ref={titleRef}
          className="text-md sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase text-primary"
        >
          You MUST Visit
        </h2>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 w-full lg:h-[600px] xl:h-[700px]">
        {/* Map Section */}
        <div
          ref={mapRef}
          className="w-full lg:w-1/2 h-[300px] sm:h-[400px] md:h-[500px] lg:h-full"
        >
          <iframe
            src="https://www.google.com/maps/d/u/0/embed?mid=1I53M-mqfiOy0Xr4HmEqh_t4cEu94C5w&ehbc=2E312F&noprof=1&hl=en"
            width="100%"
            height="100%"
            style={{
              border: "none",
              outline: "none",
            }}
            allowFullScreen
            loading="lazy"
            className="rounded-xl shadow-lg"
          />
        </div>

        {/* Cards Section */}
        <div
          ref={cardsContainerRef}
          className="w-full lg:w-1/2 min-h-[320px] sm:min-h-[420px] md:min-h-[520px] lg:h-full grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-5"
        >
          {youmust.map((item, index) => (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="group cursor-pointer h-full"
            >
              <Link href={item.link} className="block w-full h-full">
                <div className="bg-black/10 rounded-xl sm:rounded-2xl w-full h-full min-h-[150px] sm:min-h-[200px] md:min-h-[250px] relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {/* Location Pin */}
                  <IoLocationSharp
                    className={`card-pin absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 ${item.pinColor} z-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-lg`}
                  />

                  {/* Rating */}
                  <div className="card-rating flex gap-1 sm:gap-2 items-center z-20 absolute right-2 sm:right-3 md:right-4 top-2 sm:top-3 md:top-4">
                    <FaStar className="text-sm sm:text-base md:text-lg text-accent drop-shadow-lg" />
                    <div className="text-secondary font-bold text-sm sm:text-base md:text-lg lg:text-xl drop-shadow-lg">
                      {item.rating}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="card-image w-full h-full relative">
                    <Image
                      src={item.img}
                      alt={item.title}
                      fill
                      className="object-cover rounded-xl sm:rounded-2xl"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 25vw, 300px"
                    />
                  </div>

                  {/* Overlay */}

                  {/* Title */}
                  {/* <h3 className="card-title text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl p-2 sm:p-3 md:p-4 absolute left-0 bottom-0 z-20 leading-tight drop-shadow-lg font-medium">
                    {item.title}
                  </h3> */}

                  <div className="absolute left-0 bottom-0 z-10 m-2 sm:m-3 md:m-4">
                    <h3 className="card-title text-secondary text-xs sm:text-sm lg:text-lg xl:text-md leading-tight drop-shadow-lg mb-1 ">
                      {item.title}
                    </h3>

                    <div className="pt-1">
                      <span className="card-button inline-flex items-center gap-1 bg-accent/90 hover:bg-accent text-muted font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-full transition-all duration-300 text-xs sm:text-sm backdrop-blur-sm">
                        Packages
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default YouMustVisit;
