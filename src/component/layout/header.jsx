import { Component } from "react";
import { NavLink, Link } from 'react-router-dom';

class Header extends Component {
    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll = () => {
        const header = document.querySelector('.header-section');
        const value = window.scrollY;
        if (value > 200) {
            header.classList.add('header-fixed', 'fadeInUp');
        } else {
            header.classList.remove('header-fixed', 'fadeInUp');
        }
    }

    menuTrigger = () => {
        document.querySelector('.menu').classList.toggle('active');
        document.querySelector('.header-bar').classList.toggle('active');
    }

    menuTriggerTwo = () => {
        document.querySelector('.header-top').classList.toggle('open');
    }

    render() {
        return (
            <header className="header-section" style={{ width: '100%', position: 'fixed', top: 0, zIndex: 1000 }}>
                <div className="container">
                    <div className="header-holder d-flex flex-wrap justify-content-between align-items-center">
                        <div className="brand-logo d-none d-lg-inline-block">
                            <div className="logo">
                                <Link to="/">
                                    <img src="assets/images/logo/logo.png" alt="logo" width="70" height="70" />
                                </Link>
                            </div>
                        </div>
                        <div className="header-menu-part">
                            <div className="header-bottom">
                                <div className="header-wrapper justify-content-lg-end">
                                    <div className="mobile-logo d-lg-none">
                                        <Link to="/"><img src="assets/images/logo/logo.png" alt="logo" width="70" height="70" /></Link>
                                    </div>
                                    <div className="menu-area">
                                        <ul className="menu">
                                            <li>
                                                <NavLink to="/">Home</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/gamerecord">경기 기록</NavLink>
                                            </li>
                                            <li className="menu-item-has-children">
                                                <a href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-bs-offset="0,0">시즌 1 통계</a>
                                                <ul className="submenu dropdown-menu">
                                                    <li><NavLink to="/gameelo">내전 ELO</NavLink></li>
                                                    <li><NavLink to="/champstats">챔피언 통계</NavLink></li>
                                                </ul>
                                            </li>
                                            <li className="menu-item-has-children">
                                                <a href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-bs-offset="0,0">관리자 메뉴</a>
                                                <ul className="submenu dropdown-menu">
                                                    <li><NavLink to="/playerinfo">선수 정보 입력</NavLink></li>
                                                    <li><NavLink to="/gameresults">경기 정보 입력</NavLink></li>
                                                    <li><NavLink to="/update">정보 갱신</NavLink></li>
                                                </ul>
                                            </li>
                                        </ul>
                                        <div className="header-bar d-lg-none" onClick={this.menuTrigger}>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        <div className="ellepsis-bar d-lg-none" onClick={this.menuTriggerTwo}>
                                            <i className="icofont-info-square"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }
}

export default Header;
