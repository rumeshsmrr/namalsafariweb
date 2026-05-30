"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface SafariItem {
  id: number;
  img: string;
  title: string;
  link: string;
  shortDescription: string;
}

function Popular(): React.JSX.Element {
  // State for responsive card display
  const [showAllCards, setShowAllCards] = useState(false);

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLHRElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const popularSafaris: SafariItem[] = [
    {
      id: 1,
      img: "/Images/popular1.webp",
      title: "Yala National Park Safari",
      link: "/parks/yala",
      shortDescription: "High leopard density",
    },
    {
      id: 2,
      img: "/Images/gallery3.webp",
      title: "Udawalawa National Park Safari",
      link: "/parks/udawalawa",
      shortDescription: "Elephant sanctuary",
    },
    {
      id: 3,
      img: "/Images/popular3.webp",
      title: "Bundala National Park Safari",
      link: "/parks/bundala",
      shortDescription: "Migratory birds haven",
    },
    {
      id: 4,
      img: "/Images/lunu2.webp",
      title: "Lunugamwehera National Park Safari",
      link: "/parks/lunugamwehera",
      shortDescription: "Pristine wilderness",
    },
  ];

  // Check screen size and update card display
  useEffect(() => {
    const checkScreenSize = () => {
      // Show 4 cards for screens smaller than lg (below 1024px)
      // Show only 3 cards for lg screens and above (1024px+)
      setShowAllCards(window.innerWidth < 1024); // Below lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Get cards to display based on screen size
  const cardsToDisplay = showAllCards
    ? popularSafaris
    : popularSafaris.slice(0, 3);

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

      // Description animation
      gsap.fromTo(
        descriptionRef.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          delay: 0.2,
          scrollTrigger: {
            trigger: descriptionRef.current,
            start: "top 80%",
            end: "bottom 60%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Button animation
      gsap.fromTo(
        buttonRef.current,
        {
          opacity: 0,
          y: 30,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.8,
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Cards animation with stagger
      cardRefs.current.forEach((card, index) => {
        if (card && index < cardsToDisplay.length) {
          const cardImage = card.querySelector(".card-image");
          const cardOverlay = card.querySelector(".card-overlay");
          const cardTitle = card.querySelector(".card-title");
          const cardDescription = card.querySelector(".card-description");
          const cardButton = card.querySelector(".card-button");

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
              delay: index * 0.2,
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
                delay: index * 0.2 + 0.1,
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
                delay: index * 0.2 + 0.3,
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
                delay: index * 0.2 + 0.4,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Description animation
          if (cardDescription) {
            gsap.fromTo(
              cardDescription,
              {
                opacity: 0,
                y: 20,
              },
              {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                delay: index * 0.2 + 0.5,
                scrollTrigger: {
                  trigger: cardsContainerRef.current,
                  start: "top 80%",
                  end: "bottom 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Button animation
          if (cardButton) {
            gsap.fromTo(
              cardButton,
              {
                opacity: 0,
                y: 20,
                scale: 0.9,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                ease: "power2.out",
                delay: index * 0.2 + 0.6,
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
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out",
            });

            if (cardImage) {
              gsap.to(cardImage, {
                scale: 1.1,
                duration: 0.7,
                ease: "power2.out",
              });
            }

            if (cardOverlay) {
              gsap.to(cardOverlay, {
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)",
                duration: 0.3,
              });
            }

            if (cardTitle) {
              gsap.to(cardTitle, {
                color: "#fde047", // yellow-300
                duration: 0.3,
              });
            }

            if (cardDescription) {
              gsap.to(cardDescription, {
                color: "#fde047", // yellow-300
                duration: 0.3,
              });
            }

            if (cardButton) {
              gsap.to(cardButton, {
                scale: 1.05,
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
                duration: 0.7,
                ease: "power2.out",
              });
            }

            if (cardOverlay) {
              gsap.to(cardOverlay, {
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent)",
                duration: 0.3,
              });
            }

            if (cardTitle) {
              gsap.to(cardTitle, {
                color: "#ffffff",
                duration: 0.3,
              });
            }

            if (cardDescription) {
              gsap.to(cardDescription, {
                color: "#e5e7eb", // gray-200
                duration: 0.3,
              });
            }

            if (cardButton) {
              gsap.to(cardButton, {
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
  }, [cardsToDisplay]);

  return (
    <div
      ref={containerRef}
      className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12 bg-background font-display h-fit block"
    >
      {/* Header Section */}
      <div
        ref={headerRef}
        className="flex flex-row gap-2 sm:gap-3 md:gap-4 items-center mb-6 sm:mb-8 md:mb-8"
      >
        <hr
          ref={lineRef}
          className="w-[15px] sm:w-[25px] md:w-[60px] lg:w-[100px] xl:w-[155px] bg-secondary border-primary"
        />
        <h2
          ref={titleRef}
          className="text-md sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase text-primary"
        >
          Popular among visitors
        </h2>
      </div>

      {/* Description */}
      <p
        ref={descriptionRef}
        className="text-primary text-base sm:text-md md:text-lg lg:text-xl xl:text-2xl w-full mb-6 sm:mb-8 md:mb-8 leading-normal"
      >
        A safari in Sri Lanka offers an unforgettable mix of thrilling wildlife
        encounters, breathtaking landscapes, and rich biodiversity. These are
        some of the most popular safari experiences loved by visitors from
        around the world. Discover what makes each park unique.
      </p>

      {/* Safari Cards - Responsive grid layout */}
      <div
        ref={cardsContainerRef}
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8"
      >
        {cardsToDisplay.map((item, index) => (
          <div
            key={item.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="w-full aspect-[4/5] sm:aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] xl:aspect-[4/5] rounded-lg sm:rounded-xl relative block overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <Link
              href={item.link}
              className="block w-full h-full cursor-pointer"
            >
              <div className="w-full h-full relative card-image">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Overlay for better text visibility */}
              <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-300"></div>

              {/* Content Container */}
              <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-5 z-10">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="card-title text-secondary text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight drop-shadow-lg">
                    {item.title}
                  </h3>

                  <p className="card-description text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed drop-shadow-md">
                    {item.shortDescription}
                  </p>

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

      <Link
        href="/safaris"
        className="flex justify-center mt-6 sm:mt-8 md:mt-10 cursor-pointer"
      >
        <button
          ref={buttonRef}
          className="bg-accent hover:bg-accent/90 text-muted font-medium py-3 px-8 sm:px-10 md:px-12 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-sm sm:text-base md:text-lg cursor-pointer inline-flex items-center gap-2"
        >
          View All Safaris
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
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
        </button>
      </Link>
    </div>
  );
}

export default Popular;
