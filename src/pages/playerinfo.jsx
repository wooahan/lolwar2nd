import { Component, Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import { db } from "../config/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

let BlogContentListTwo = [
    {
        title: 'A팀',
    },
    {
        title: 'B팀',
    },
];

const PlayerInfo = () => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState("");
    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState({});
    const [searchText, setSearchText] = useState("");
    const [championList, setChampionList] = useState([]);
    const [filteredChampions, setFilteredChampions] = useState([]);
    const [championSearchText, setChampionSearchText] = useState("");
    const [showChampionList, setShowChampionList] = useState(null);
    const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [matchTime, setMatchTime] = useState("");

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "선수 정보"));
                const playersData = querySnapshot.docs.map((doc) => doc.data());
                playersData.sort((a, b) => a.name.localeCompare(b.name));
                setPlayers(playersData);
                setFilteredPlayers(playersData);
            } catch (error) {
                console.error("Error fetching players: ", error);
            }
        };

        if (isAuthorized) {
            fetchPlayers();
        }
    }, [isAuthorized]);

    useEffect(() => {
        const fetchChampions = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "챔피언 정보"));
                const championsData = querySnapshot.docs.map((doc) => doc.data().name);
                championsData.sort((a, b) => a.localeCompare(b));
                setChampionList(championsData);
                setFilteredChampions(championsData);
            } catch (error) {
                console.error("Error fetching champions: ", error);
            }
        };

        fetchChampions();
    }, []);

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handlePasswordSubmit = () => {
        if (password === "1717") {
            setIsAuthorized(true);
        } else {
            alert("비밀번호가 틀립니다. 다시 시도해 주세요.");
        }
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        const filtered = players.filter(
            (player) =>
                player.name.toLowerCase().includes(e.target.value.trim().toLowerCase()) ||
                player.nickname.toLowerCase().includes(e.target.value.trim().toLowerCase())
        );
        setFilteredPlayers(filtered);
    };

    const handlePlayerClick = (player) => {
        const emptySlotIndex = [...Array(10).keys()].find((index) => !selectedPlayers.hasOwnProperty(index));
        if (emptySlotIndex !== undefined) {
            setSelectedPlayers((prevSelectedPlayers) => ({
                ...prevSelectedPlayers,
                [emptySlotIndex]: { ...player, kills: '', deaths: '', assists: '', champion: '', line: '' },
            }));
        } else {
            alert("모든 슬롯이 가득 차 있습니다.");
        }
    };

    const handleCancelPlayer = (index) => {
        setSelectedPlayers((prevSelectedPlayers) => {
            const newSelectedPlayers = { ...prevSelectedPlayers };
            delete newSelectedPlayers[index];
            return newSelectedPlayers;
        });
    };

    const handleInputChange = (index, field, value) => {
        setSelectedPlayers((prevSelectedPlayers) => ({
            ...prevSelectedPlayers,
            [index]: {
                ...prevSelectedPlayers[index],
                [field]: value,
            },
        }));
    };

    const handleChampionClick = (index, champion) => {
        setSelectedPlayers((prevSelectedPlayers) => ({
            ...prevSelectedPlayers,
            [index]: {
                ...prevSelectedPlayers[index],
                champion,
            },
        }));
        setShowChampionList(null);
    };

    const handleChampionFocus = (index) => {
        setShowChampionList(index);
    };

    const handleMatchDateChange = (e) => {
        setMatchDate(e.target.value);
    };

    const handleMatchTimeChange = (e) => {
        setMatchTime(e.target.value);
    };

    const handleSaveMatch = async () => {
        if (!matchDate || !matchTime || Object.keys(selectedPlayers).length < 10) {
            alert("아직 모든 데이터가 입력되지 않았습니다.");
            return;
        }

        for (let i = 0; i < 10; i++) {
            const player = selectedPlayers[i];
            if (!player || !player.kills || !player.deaths || !player.assists || !player.champion || !player.line) {
                alert("아직 모든 데이터가 입력되지 않았습니다.");
                return;
            }
        }

        const matchData = {
            matchDate,
            matchTime,
            teams: {
                A: Object.values(selectedPlayers).slice(0, 5).map((player) => ({
                    name: player.name,
                    nickname: player.nickname,
                    kills: player.kills,
                    deaths: player.deaths,
                    assists: player.assists,
                    champion: player.champion,
                    line: player.line,
                })),
                B: Object.values(selectedPlayers).slice(5, 10).map((player) => ({
                    name: player.name,
                    nickname: player.nickname,
                    kills: player.kills,
                    deaths: player.deaths,
                    assists: player.assists,
                    champion: player.champion,
                    line: player.line,
                })),
            },
        };

        try {
            await addDoc(collection(db, "경기 정보"), matchData);
            alert("경기 저장이 완료되었습니다!");
            setMatchDate("");
            setMatchTime("");
            setSelectedPlayers({});
        } catch (error) {
            console.error("Error saving match data: ", error);
            alert("경기 정보 저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <Fragment>
            <Header />
            <PageHeader title={'선수 정보 입력'} curPage={'playerinfo'} />
            <div className="blog-section padding-top padding-bottom">
                <div className="container">
                    <div className="section-wrapper">
                        {!isAuthorized ? (
                            <div className="password-section text-center">
                                <div style={{ marginBottom: '50px' }}>
                                    <h3>관리자 비밀번호를 입력하세요.</h3>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    placeholder="비밀번호 입력"
                                    style={{ marginBottom: '50px', color: 'white' }}
                                />
                                <button onClick={handlePasswordSubmit} type="submit" className="default-button" style={{ position: 'relative', display: 'flex', margin: '0 auto', alignItems: 'center' }}>
                                    <span>확인</span>
                                </button>
                            </div>
                        ) : (
                            <Fragment>
                                <div className="row g-4 justify-content-center">
                                    <div className="col-12">
                                        <div className="blog-item">
                                            <div className="blog-inner d-flex flex-wrap align-items-center">
                                                <div className="blog-content p-4 w-100 text-center">
                                                    <div style={{ marginBottom: '45px' }}>
                                                        <h3 style={{ color: 'white' }}>경기 날짜 및 시간 입력</h3>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                                                            <input
                                                                type="date"
                                                                value={matchDate}
                                                                onChange={handleMatchDateChange}
                                                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white' }}
                                                            />
                                                            <select
                                                                value={matchTime}
                                                                onChange={handleMatchTimeChange}
                                                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white', backgroundColor: '#1A223F' }}
                                                            >
                                                                <option value="" style={{ color: 'white' }}>경기 시간 선택</option>
                                                                <option value="오후 3시" style={{ color: 'white' }}>오후 3시</option>
                                                                <option value="오후 5시" style={{ color: 'white' }}>오후 5시</option>
                                                                <option value="오후 7시" style={{ color: 'white' }}>오후 7시</option>
                                                                <option value="1차" style={{ color: 'white' }}>1차</option>
                                                                <option value="2차" style={{ color: 'white' }}>2차</option>
                                                                <option value="3차" style={{ color: 'white' }}>3차</option>
                                                                <option value="4차" style={{ color: 'white' }}>4차</option>
                                                                <option value="5차" style={{ color: 'white' }}>5차</option>
                                                                <option value="6차" style={{ color: 'white' }}>6차</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginBottom: '30px' }}></div>
                                                    <h3 style={{ color: 'white' }}>선수 목록</h3>
                                                    <form action="/" className="search-wrapper" style={{ marginTop: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                                                        <input
                                                            type="text"
                                                            name="s"
                                                            id="item01"
                                                            placeholder="선수 검색..."
                                                            value={searchText}
                                                            onChange={handleSearchChange}
                                                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '300px', marginRight: '10px', color: 'white' }}
                                                        />
                                                    </form>
                                                    <div style={{ backgroundColor: '#080E37', padding: '5px', borderRadius: '10px', marginTop: '30px' }}>
                                                        {filteredPlayers.length > 0 ? (
                                                            <div className="row g-1" style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                {filteredPlayers.map((player, index) => (
                                                                    <div key={index} className="col-md-4" style={{ padding: '5px', boxSizing: 'border-box' }}>
                                                                        <div
                                                                            style={{ backgroundColor: '#1A223F', padding: '20px', borderRadius: '10px', textAlign: 'center', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', transition: 'background-color 0.3s' }}
                                                                            onClick={() => handlePlayerClick(player)}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF004F'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A223F'}
                                                                        >
                                                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                                                <h5 style={{ fontSize: '16px', margin: 0 }}>{player.name} ({player.nickname})</h5>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ color: 'white' }}>불러오는 중...</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {BlogContentListTwo.map((val, i) => (
                                        <div className="col-lg-6 col-12 text-center" key={i}>
                                            <div className="blog-item">
                                                <div className="blog-inner">
                                                    <div className="blog-content px-3 py-4">
                                                        <h3 style={{ color: 'white' }}>{val.title}</h3>
                                                        <div className="row g-3 mt-3">
                                                            {[...Array(5)].map((_, idx) => (
                                                                <div key={idx} style={{ position: 'relative' }}>
                                                                    {selectedPlayers[i * 5 + idx] ? (
                                                                        <div style={{ backgroundColor: '#080E37', padding: '35px', borderRadius: '10px', textAlign: 'center', color: 'white', border: '1px solid #ffffff', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                                                            <h5 style={{ margin: 0 }}>{selectedPlayers[i * 5 + idx].name} ({selectedPlayers[i * 5 + idx].nickname})</h5>
                                                                            <button
                                                                                onClick={() => handleCancelPlayer(i * 5 + idx)}
                                                                                style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', padding: '5px', cursor: 'pointer' }}
                                                                            >
                                                                                취소
                                                                            </button>
                                                                            <div style={{ marginTop: '10px' }}>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="킬 수"
                                                                                    value={selectedPlayers[i * 5 + idx].kills}
                                                                                    onChange={(e) => handleInputChange(i * 5 + idx, 'kills', e.target.value)}
                                                                                    style={{ width: '100px', color: 'white', marginRight: '5px' }}
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="데스 수"
                                                                                    value={selectedPlayers[i * 5 + idx].deaths}
                                                                                    onChange={(e) => handleInputChange(i * 5 + idx, 'deaths', e.target.value)}
                                                                                    style={{ width: '100px', color: 'white', marginRight: '5px' }}
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="어시스트 수"
                                                                                    value={selectedPlayers[i * 5 + idx].assists}
                                                                                    onChange={(e) => handleInputChange(i * 5 + idx, 'assists', e.target.value)}
                                                                                    style={{ width: '100px', color: 'white' }}
                                                                                />
                                                                            </div>
                                                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="챔피언 등록"
                                                                                    value={selectedPlayers[i * 5 + idx].champion}
                                                                                    onFocus={() => handleChampionFocus(i * 5 + idx)}
                                                                                    readOnly
                                                                                    style={{ width: '150px', color: 'white', textAlign: 'center', transition: 'background-color 0.3s' }}
                                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF004F'}
                                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#080E37'}
                                                                                />
                                                                                {showChampionList === i * 5 + idx && (
                                                                                    <div style={{ position: 'absolute', top: '100%', left: '0', backgroundColor: '#080E37', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1000, width: '100%', border: '1px solid white' }}>
                                                                                        <div className="row g-1" style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                                            {filteredChampions.length > 0 ? (
                                                                                                filteredChampions.map((champion, index) => (
                                                                                                    <div key={index} className="col-md-4" style={{ padding: '5px', boxSizing: 'border-box' }}>
                                                                                                        <div
                                                                                                            style={{ backgroundColor: '#1A223F', padding: '10px', borderRadius: '10px', textAlign: 'center', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', transition: 'background-color 0.3s' }}
                                                                                                            onClick={() => handleChampionClick(i * 5 + idx, champion)}
                                                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF004F'}
                                                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A223F'}
                                                                                                        >
                                                                                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                                                                                <h5 style={{ fontSize: '14px', margin: 0 }}>{champion}</h5>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))
                                                                                            ) : (
                                                                                                <p style={{ color: 'white', textAlign: 'center', width: '100%' }}>검색 결과가 없습니다.</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <select
                                                                                    value={selectedPlayers[i * 5 + idx].line}
                                                                                    onChange={(e) => handleInputChange(i * 5 + idx, 'line', e.target.value)}
                                                                                    style={{ width: '150px', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#1A223F' }}
                                                                                >
                                                                                    <option value="" style={{ color: 'white' }}>라인 선택</option>
                                                                                    <option value="탑" style={{ color: 'white' }}>탑</option>
                                                                                    <option value="정글" style={{ color: 'white' }}>정글</option>
                                                                                    <option value="미드" style={{ color: 'white' }}>미드</option>
                                                                                    <option value="원딜" style={{ color: 'white' }}>원딜</option>
                                                                                    <option value="서폿" style={{ color: 'white' }}>서폿</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ backgroundColor: '#080E37', padding: '20px', borderRadius: '10px', textAlign: 'center', color: 'white', border: '1px solid #ffffff', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                            <h5 style={{ margin: 0 }}>{idx + 1}번 선수 선택</h5>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center mt-5">
                                    <button onClick={handleSaveMatch} className="default-button">
                                        <span>경기 저장</span>
                                    </button>
                                </div>
                            </Fragment>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </Fragment>
    );
};

export default PlayerInfo;