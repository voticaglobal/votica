import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { WhatYouGet } from "../components/landing/WhatYouGet";
import { ForYou } from "../components/landing/ForYou";
import { WhyDifferent } from "../components/landing/WhyDifferent";
import { CreatorCommerce } from "../components/landing/CreatorCommerce";
import { FinalCTA } from "../components/landing/FinalCTA";

export function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WhatYouGet />
      <ForYou />
      <WhyDifferent />
      <CreatorCommerce />
      <FinalCTA />
    </>
  );
}
