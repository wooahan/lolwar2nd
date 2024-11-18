import { Component, Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import HrShape from "../component/layout/hrshape";
import AboutSection from "../component/section/about";
import BannerSection from "../component/section/banner";
import BlogSection from "../component/section/blog";
import RandomLadder from "../component/section/randomladder";
import CtaSection from "../component/section/cta";
import MatchSection from "../component/section/match";
import PlayerSection from "../component/section/player";
import ProductSection from "../component/section/product";
import SponsorSection from "../component/section/sponsor";
import TestimonialSection from "../component/section/testimonial";
import VideoSection from "../component/section/video";
import React from "react";

class HomePage extends Component {
  render() {
    return (
      <Fragment>
        <Header />
        <RandomLadder />
        <AboutSection imgUrl={"assets/images/about/01.png"} />
        <Footer />
      </Fragment>
    );
  }
}

export default HomePage;
