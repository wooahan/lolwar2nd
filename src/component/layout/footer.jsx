import { Component } from "react";
import { Link } from "react-router-dom";
import Rating from "../section/rating";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const postTitle = "내전 ELO 랭킹 순위";
const newsTitle = "최근 경기 기록";

class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newsName: '',
            newsEmail: '',
            players: [],
        };
    }

    async componentDidMount() {
        try {
            const playerCollection = collection(db, "선수 정보");
            const playerSnapshot = await getDocs(playerCollection);
            const playerList = playerSnapshot.docs.map((doc) => {
                const playerData = doc.data();
                console.log("Player Data:", playerData);
                return {
                    id: doc.id,
                    name: playerData.name,
                    elo: playerData.elo || 0,
                    tier: this.getTier(playerData.elo || 0),
                };
            });
            playerList.sort((a, b) => b.elo - a.elo);
            const top3Players = playerList.slice(0, 3);

            const gameCollection = collection(db, "경기 정보");
            const gameSnapshot = await getDocs(gameCollection);

            if (gameSnapshot.empty) {
                console.error("No games found in '경기 정보' collection.");
                this.setState({ players: top3Players, recentGame: null });
                return;
            }

            const games = gameSnapshot.docs.map((doc) => doc.data());
            games.sort((a, b) => {
                if (a.matchDate < b.matchDate) return 1;
                if (a.matchDate > b.matchDate) return -1;

                const timeOrder = ["오후 1시", "오후 2시", "오후 3시", "오후 4시", "오후 5시", "오후 6시", "오후 7시", "1차", "2차", "3차", "4차", "5차", "6차"];
                return timeOrder.indexOf(b.matchTime) - timeOrder.indexOf(a.matchTime);
            });

            const recentGame = games[0];

            if (recentGame) {
                recentGame.teams.A = recentGame.teams.A.map(player => {
                    const playerInfo = playerList.find(p => p.name === player.name);
                    return {
                        ...player,
                        elo: playerInfo ? playerInfo.elo : 0,
                    };
                });
                recentGame.teams.B = recentGame.teams.B.map(player => {
                    const playerInfo = playerList.find(p => p.name === player.name);
                    return {
                        ...player,
                        elo: playerInfo ? playerInfo.elo : 0,
                    };
                });
            }

            this.setState({ players: top3Players, recentGame: recentGame });
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    }

    getTier(elo) {
        if (elo >= 3000) return "챌린저";
        if (elo >= 2500) return "그랜드마스터";
        if (elo >= 2300) return "마스터";
        if (elo >= 2200) return "다이아몬드1";
        if (elo >= 2150) return "다이아몬드2";
        if (elo >= 2100) return "다이아몬드3";
        if (elo >= 2050) return "다이아몬드4";
        if (elo >= 1950) return "에메랄드1";
        if (elo >= 1900) return "에메랄드2";
        if (elo >= 1850) return "에메랄드3";
        if (elo >= 1800) return "에메랄드4";
        if (elo >= 1700) return "플래티넘1";
        if (elo >= 1650) return "플래티넘2";
        if (elo >= 1600) return "플래티넘3";
        if (elo >= 1550) return "플래티넘4";
        if (elo >= 1450) return "골드1";
        if (elo >= 1400) return "골드2";
        if (elo >= 1350) return "골드3";
        if (elo >= 1300) return "골드4";
        if (elo >= 1200) return "실버1";
        if (elo >= 1150) return "실버2";
        if (elo >= 1100) return "실버3";
        if (elo >= 1050) return "실버4";
        if (elo >= 950) return "브론즈1";
        if (elo >= 900) return "브론즈2";
        if (elo >= 850) return "브론즈3";
        if (elo >= 800) return "브론즈4";
        if (elo < 800) return "아이언";
        return "N/A";
    }

    getTierImage(tier) {
        switch (tier) {
            case "아이언":
                return require("../../assets/images/tier/iron.png");
            case "브론즈1":
            case "브론즈2":
            case "브론즈3":
            case "브론즈4":
                return require("../../assets/images/tier/bronze.png");
            case "실버1":
            case "실버2":
            case "실버3":
            case "실버4":
                return require("../../assets/images/tier/silver.png");
            case "골드1":
            case "골드2":
            case "골드3":
            case "골드4":
                return require("../../assets/images/tier/gold.png");
            case "플래티넘1":
            case "플래티넘2":
            case "플래티넘3":
            case "플래티넘4":
                return require("../../assets/images/tier/platinum.png");
            case "에메랄드1":
            case "에메랄드2":
            case "에메랄드3":
            case "에메랄드4":
                return require("../../assets/images/tier/emerald.png");
            case "다이아몬드1":
            case "다이아몬드2":
            case "다이아몬드3":
            case "다이아몬드4":
                return require("../../assets/images/tier/diamond.png");
            case "마스터":
                return require("../../assets/images/tier/master.png");
            case "그랜드마스터":
                return require("../../assets/images/tier/grandmaster.png");
            case "챌린저":
                return require("../../assets/images/tier/challenger.png");
            default:
                return null;
        }
    }

    renderRecentGame() {
        const { recentGame } = this.state;
        if (!recentGame) return <p style={{ textAlign: 'center' }}>경기 정보 없음</p>;

        const teamA = recentGame.teams.A.map((player) => {
            console.log("Updated Team A Player with ELO:", player);
            return player;
        });
        const teamB = recentGame.teams.B.map((player) => {
            console.log("Updated Team B Player with ELO:", player);
            return player;
        });

        return (
            <div className="recent-game" style={{ textAlign: 'center' }}>
                <p>{`${recentGame.matchDate} ${recentGame.matchTime} 경기`}</p>
                <div className="team" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    {teamA.map((player, index) => (
                        <div key={index} className="player-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={this.getTierImage(this.getTier(player.elo))} alt={`${this.getTier(player.elo)} 티어 이미지`} style={{ width: '30px', height: '30px', marginBottom: '5px', marginTop: '10px' }} />
                            <span style={{ textAlign: 'center' }}>{player.name}</span>
                        </div>
                    ))}
                </div>
                <div className="vs" style={{ textAlign: 'center', margin: '20px 0' }}>vs</div>
                <div className="team" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    {teamB.map((player, index) => (
                        <div key={index} className="player-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={this.getTierImage(this.getTier(player.elo))} alt={`${this.getTier(player.elo)} 티어 이미지`} style={{ width: '30px', height: '30px', marginBottom: '5px' }} />
                            <span style={{ textAlign: 'center' }}>{player.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }


    render() {
        const { players } = this.state;

        let FooterItemList = players.map((player, index) => ({
            imgUrl: require(`../../assets/images/badge/Medal ${index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'}.png`),
            imgAlt: `${index + 1}위 메달`,
            title: player.name,
            proName: 'elo',
            proPrice: player.elo,
            tierImgUrl: this.getTierImage(player.tier),
            tierAlt: `${player.tier} 티어 이미지`,
        }));

        return (
            <footer className="footer-section">
                <div className="footer-middle padding-top padding-bottom" style={{ backgroundImage: "url(/assets/images/footer/bg.jpg)" }}>
                    <div className="container">
                        <div className="row padding-lg-top">
                            <div className="col-lg-4 col-md-6 col-12">
                                <div className="footer-middle-item-wrapper">
                                    <div className="footer-middle-item mb-lg-0">
                                        <div className="fm-item-title mb-4">
                                            <img src="assets/images/logo/logo.png" alt="logo" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-12">
                                <div className="footer-middle-item-wrapper">
                                    <div className="footer-middle-item mb-lg-0">
                                        <div className="fm-item-title">
                                            <h4>{postTitle}</h4>
                                        </div>
                                        <div className="fm-item-content">
                                            {FooterItemList.map((val, i) => (
                                                <div className="fm-item-widget lab-item" key={i}>
                                                    <div className="lab-inner">
                                                        <div className="lab-thumb">
                                                            <Link to="/gameelo"> <img src={`${val.imgUrl}`} alt={`${val.imgAlt}`} /></Link>
                                                        </div>
                                                        <div className="lab-content">
                                                            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                                                                <img src={`${val.tierImgUrl}`} alt={`${val.tierAlt}`} style={{ width: '20px', height: '20px', marginRight: '10px' }} />
                                                                <h6><Link to="/gameelo">{val.title}</Link></h6>
                                                            </div>

                                                            <p>{val.proName}: <b>{val.proPrice}</b></p>
                                                            <Rating />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-12">
                                <div className="footer-middle-item-wrapper">
                                    <div className="footer-middle-item-3 mb-lg-0" style={{ textAlign: 'center' }}>
                                        <div className="fm-item-title">
                                            <h4>{newsTitle}</h4>
                                        </div>
                                        <div className="fm-item-content">
                                            {this.renderRecentGame()}
                                            <Link to="/gamerecord" className="default-button" style={{ marginTop: '50px' }}>
                                                <span>더 보러가기 <i className="icofont-circled-right"></i></span>
                                            </Link>                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <div className="footer-bottom-content text-center">
                                    <p>&copy; 2024 LOL 2nd period - how to make 100 million won a year from gaming.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }
}

export default Footer;