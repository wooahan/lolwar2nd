import React, { Component } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const subtitle = "랜덤 팀 나누기";
const title = "사다리 게임";

class RandomLadder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: "balancedTeam",
            players: [],
            teamA: "",
            teamB: "",
            selectedPlayers: [],
            assignedPlayers: [[null, null, null, null, null], [null, null, null, null, null], [null, null, null, null, null], [null, null, null, null, null]], auctionPlayers: [],
            visibleTeams: [false, false, false, false],
            isResetting: false,
            teamPoints: [100, 100, 100, 100],
            isProcessing: false,
            teamCaptains: [],
            topTeams: [],
        };
    }

    async componentDidMount() {
        try {
            const querySnapshot = await getDocs(collection(db, "선수 정보"));
            let players = querySnapshot.docs.map((doc) => {
                const player = doc.data();
                player.tier = this.getTier(player.elo);
                return player;
            });

            players = players.sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });

            this.setState({ players });
        } catch (error) {
            console.error("Error fetching players: ", error);
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

    handlePlayerClick(player) {
        if (this.state.isResetting) {
            return;
        }

        this.setState((prevState) => {
            if (!prevState.selectedPlayers.some(p => p.playerNo === player.playerNo)) {
                return {
                    selectedPlayers: [...prevState.selectedPlayers, player]
                };
            }
            return prevState;
        });
    }

    handleAssignedPlayerClick(player) {
        this.setState((prevState) => {
            const newAssignedPlayers = [...prevState.assignedPlayers];
            const newVisibleTeams = [...prevState.visibleTeams];
            let assigned = false;

            for (let teamIndex = 0; teamIndex < newAssignedPlayers.length; teamIndex++) {
                const team = newAssignedPlayers[teamIndex];

                if (team[0] === null) {
                    newAssignedPlayers[teamIndex] = [player, null, null, null, null];
                    newVisibleTeams[teamIndex] = true;
                    assigned = true;
                    break;
                }
            }

            if (assigned) {
                const newSelectedPlayers = prevState.selectedPlayers.filter(
                    (p) => p.name !== player.name || p.nickname !== player.nickname
                );

                return {
                    assignedPlayers: newAssignedPlayers,
                    visibleTeams: newVisibleTeams,
                    selectedPlayers: newSelectedPlayers,
                };
            }

            return prevState;
        });
    }


    handleResetAssignedPlayer(index) {
        this.setState({ isResetting: true }, () => {
            this.setState((prevState) => {
                const newAssignedPlayers = prevState.assignedPlayers.map((player, idx) => {
                    return idx === index ? null : player;
                });

                const playerToReset = prevState.assignedPlayers[index];
                const newSelectedPlayers = playerToReset ? [...prevState.selectedPlayers, playerToReset] : prevState.selectedPlayers;

                return {
                    assignedPlayers: newAssignedPlayers,
                    selectedPlayers: newSelectedPlayers,
                    isResetting: false,
                };
            });
        });
    }

    assignBalancedTeams = () => {
        const { selectedPlayers } = this.state;
    
        if (selectedPlayers.length < 10) {
            alert("팀을 배정하기 위해 최소 10명의 선수가 필요합니다.");
            return;
        }
    
        const sortedPlayers = [...selectedPlayers].sort((a, b) => b.elo - a.elo);
    
        let topTeams = [];
    
        const processGroup = (group, groupName) => {
            const allCombinations = this.allCombinations(group, 5);
            let possibleTeams = [];
            const seenKeys = new Set();
    
            allCombinations.forEach((teamA) => {
                const teamB = group.filter(player => !teamA.includes(player));
                if (teamA.length === 5 && teamB.length === 5) {
                    const teamAElo = teamA.reduce((sum, player) => sum + player.elo, 0) / teamA.length;
                    const teamBElo = teamB.reduce((sum, player) => sum + player.elo, 0) / teamB.length;
    
                    let finalTeamA, finalTeamB, finalTeamAElo, finalTeamBElo;
                    if (teamAElo <= teamBElo) {
                        finalTeamA = teamA;
                        finalTeamB = teamB;
                        finalTeamAElo = teamAElo;
                        finalTeamBElo = teamBElo;
                    } else {
                        finalTeamA = teamB;
                        finalTeamB = teamA;
                        finalTeamAElo = teamBElo;
                        finalTeamBElo = teamAElo;
                    }
    
                    const teamKey = [
                        finalTeamA.map(player => player.name).sort().join(","),
                        finalTeamB.map(player => player.name).sort().join(","),
                    ].join("|");
    
                    if (!seenKeys.has(teamKey)) {
                        seenKeys.add(teamKey);
                        possibleTeams.push({
                            groupName,
                            teamA: finalTeamA,
                            teamB: finalTeamB,
                            teamAElo: finalTeamAElo,
                            teamBElo: finalTeamBElo,
                            eloDifference: Math.abs(finalTeamAElo - finalTeamBElo),
                        });
                    }
                }
            });
    
            possibleTeams.sort((a, b) => a.eloDifference - b.eloDifference);
            topTeams.push(...possibleTeams.slice(0, 3));
        };
    
        if (selectedPlayers.length === 10) {
            processGroup(sortedPlayers, "전체 팀 구성");
        }
    
        if (selectedPlayers.length === 20) {
            const group1 = sortedPlayers.slice(0, 10); 
            const group2 = sortedPlayers.slice(10, 20); 
    
            processGroup(group1, "상위 10명 팀 구성");
            processGroup(group2, "하위 10명 팀 구성");
        }
    
        this.setState({ topTeams });
    };
    
    
    





    
    allCombinations = (array, size) => {
        const results = [];
        if (size > array.length) return results;
        if (size === array.length) return [array];
        if (size === 1) return array.map(item => [item]);

        array.forEach((current, index) => {
            const remaining = array.slice(index + 1);
            const combinations = this.allCombinations(remaining, size - 1);
            const attached = combinations.map(combination => [current, ...combination]);
            results.push(...attached);
        });

        return results;
    };

    handleAuctionDraw = () => {
        if (this.state.isProcessing) {
            return;
        }

        this.setState({ isProcessing: true });

        if (this.state.selectedPlayers.length === 0) {
            alert('참여 인원 중 선수가 없습니다.');
            this.setState({ isProcessing: false });
            return;
        }

        let updatedSelectedPlayers = [...this.state.selectedPlayers];
        if (this.state.auctionPlayers.length > 0) {
            updatedSelectedPlayers.push(this.state.auctionPlayers[0]);
        }

        let eligiblePlayers = [...updatedSelectedPlayers];
        if (eligiblePlayers.length > 8) {
            eligiblePlayers = eligiblePlayers.sort((a, b) => b.elo - a.elo).slice(0, 8);
        }

        const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
        const selectedPlayer = eligiblePlayers[randomIndex];

        this.setState({
            selectedPlayers: updatedSelectedPlayers.filter(
                (player) => player.name !== selectedPlayer.name
            ),
            auctionPlayers: [selectedPlayer],
            isProcessing: false,
        });
    };

    handleRemovePlayer(playerNo) {
        this.setState((prevState) => ({
            selectedPlayers: prevState.selectedPlayers.filter(player => player.playerNo !== playerNo)
        }));
    }

    calculateAverageElo = (team) => {
        const players = team.filter((player) => player !== null);
        if (players.length === 0) return 0;

        const totalElo = players.reduce((sum, player) => sum + player.elo, 0);
        return Math.floor(totalElo / players.length);
    };

    handleResetTeam = (teamIndex) => {
        this.setState((prevState) => {
            const newAssignedPlayers = [...prevState.assignedPlayers];
            newAssignedPlayers[teamIndex] = [null, null, null, null, null];

            const newVisibleTeams = [...prevState.visibleTeams];
            newVisibleTeams[teamIndex] = false;

            const newTeamPoints = [...prevState.teamPoints];
            newTeamPoints[teamIndex] = 100;

            return {
                assignedPlayers: newAssignedPlayers,
                visibleTeams: newVisibleTeams,
                teamPoints: newTeamPoints,
            };
        });
    };


    handleAuctionAssign = (teamIndex, event) => {
        event.stopPropagation();

        if (this.state.isProcessing || this.state.auctionPlayers.length === 0) {
            if (this.state.auctionPlayers.length === 0) {
                alert('경매 매물이 없습니다.');
            }
            return;
        }

        this.setState({ isProcessing: true });

        this.setState((prevState) => {
            if (prevState.auctionPlayers.length === 0) {
                alert('경매 매물이 없습니다.');
                return { isProcessing: false };
            }

            const selectedPlayer = { ...prevState.auctionPlayers[0] };
            const pointInputValue = parseInt(document.getElementById('auctionPointInput').value, 10);

            if (isNaN(pointInputValue) || pointInputValue <= 0) {
                alert('유효한 포인트를 입력하세요.');
                return { isProcessing: false };
            }

            if (prevState.teamPoints[teamIndex] < pointInputValue) {
                alert('팀의 포인트가 부족합니다.');
                return { isProcessing: false };
            }

            selectedPlayer.points = pointInputValue;

            const newAssignedPlayers = [...prevState.assignedPlayers].map(team => [...team]);
            const newVisibleTeams = [...prevState.visibleTeams];
            const newTeamPoints = [...prevState.teamPoints];

            let assigned = false;

            for (let slotIndex = 0; slotIndex < newAssignedPlayers[teamIndex].length; slotIndex++) {
                if (newAssignedPlayers[teamIndex][slotIndex] === null) {
                    newAssignedPlayers[teamIndex][slotIndex] = selectedPlayer;
                    newVisibleTeams[teamIndex] = true;
                    newTeamPoints[teamIndex] -= pointInputValue;
                    assigned = true;
                    break;
                }
            }

            if (!assigned) {
                alert('해당 팀에 빈 슬롯이 없습니다.');
                return { isProcessing: false };
            }

            return {
                assignedPlayers: newAssignedPlayers,
                visibleTeams: newVisibleTeams,
                auctionPlayers: [],
                teamPoints: newTeamPoints,
                isProcessing: false,
            };
        });
    };

    copyTeamToClipboard = (team) => {
        let players;
        if (team === 'A') {
            players = this.state.teamA;
        } else if (team === 'B') {
            players = this.state.teamB;
        }

        if (players && players.length > 0) {
            const playerNames = players.map(player => player.nickname ? `${player.name} (${player.nickname})` : player.name).join(', ');
            navigator.clipboard.writeText(playerNames)
                .then(() => {
                    alert(`${team}팀 선수들이 클립보드에 복사되었습니다.`);
                })
                .catch(err => {
                    console.error('복사 실패:', err);
                });
        }
    }

    assignTeams() {
        const teamASize = parseInt(document.getElementById("teamASize").value, 10);
        const teamBSize = parseInt(document.getElementById("teamBSize").value, 10);

        if (teamASize + teamBSize > this.state.selectedPlayers.length) {
            alert("선택된 선수 수가 입력된 팀 인원 수의 합보다 적습니다.");
            return;
        } else if (teamASize + teamBSize < this.state.selectedPlayers.length) {
            alert("선택된 선수 수가 입력된 팀 인원 수의 합보다 많습니다.")
            return;
        }

        let shuffledPlayers = [...this.state.selectedPlayers].sort(() => 0.5 - Math.random());

        const teamA = shuffledPlayers.slice(0, teamASize);
        const teamB = shuffledPlayers.slice(teamASize, teamASize + teamBSize);

        this.setState({ teamA, teamB, selectedPlayers: [] });
    }

    handleTabChange = (tab) => {
        this.setState({ activeTab: tab });
    };

    renderLadderGame() {
        return (
            <section
                className="collection-section padding-top padding-bottom"
                style={{
                    marginTop: '50px',
                    paddingTop: '10px',
                }}
            >
                <div className="container">
                    <div className="section-header">
                        <p>{subtitle}</p>
                        <h2>{title}</h2>
                    </div>
                    <div className="split-container" style={{ display: 'flex' }}>
                        <div className="left-container"
                            style={{
                                flex: 1,
                                marginRight: '10px',
                                padding: '20px',
                                border: '8px solid #232a5c',
                                textAlign: 'center',
                                backgroundColor: '#0a0a2a',
                            }}
                        >                            {this.state.players.length > 0 ? (
                            <div className="player-list">
                                {this.state.players.map((player, index) => {
                                    const tier = this.getTier(player.elo);
                                    const tierImage = this.getTierImage(tier);

                                    return (
                                        <div key={index} className="player-item" style={{ width: '100px', padding: '10px', margin: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}
                                            onClick={() => this.handlePlayerClick(player)}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {tierImage && (
                                                    <img src={tierImage} alt={tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                )}
                                                <p className="player-name" style={{ margin: '2px 0', marginLeft: "5px", fontSize: '20px', fontWeight: 'bold', color: 'white', transition: 'color 0.3s' }}
                                                    onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                    onMouseLeave={(e) => e.target.style.color = 'white'}
                                                >{player.name}</p>
                                            </div>
                                            {player.nickname && (
                                                <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>Loading 선수 정보...</p>
                        )}
                        </div>
                        <div className="right-container" style={{
                            flex: 1,
                            marginLeft: '10px',
                            padding: '20px',
                            border: '8px solid #232a5c',
                            textAlign: 'center',
                            backgroundImage: `url(${require('../../assets/images/blog/bg.jpg')})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ width: '100%' }}>
                                <h3 style={{ margin: '20px 0', marginBottom: "30px" }}>내전 팀 구성</h3>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                                        <label htmlFor="teamASize" style={{ marginRight: '5px', color: 'white' }}>내전 A팀:</label>
                                        <input
                                            type="number"
                                            id="teamASize"
                                            name="teamASize"
                                            value={this.state.teamASize}
                                            onChange={this.handleTeamSizeChange}
                                            style={{ width: '50px', padding: '5px', marginRight: '5px' }}
                                        />
                                        <span style={{ color: 'white', marginRight: "20px" }}>명</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <label htmlFor="teamBSize" style={{ marginRight: '5px', color: 'white' }}>내전 B팀:</label>
                                        <input
                                            type="number"
                                            id="teamBSize"
                                            name="teamBSize"
                                            value={this.state.teamBSize}
                                            onChange={this.handleTeamSizeChange}
                                            style={{ width: '50px', padding: '5px', marginRight: '5px' }}
                                        />
                                        <span style={{ color: 'white' }}>명</span>
                                    </div>
                                </div>

                                <h4 style={{ color: 'white', marginTop: "50px", marginBottom: '20px' }}>선택된 선수들:</h4>
                                <div className="selected-players" style={{ width: '500px', marginBottom: '20px', padding: '20px', border: '8px solid #232a5c', textAlign: 'center', backgroundColor: '#0a0a2a', overflowY: 'auto', position: 'relative' }}>
                                    {this.state.selectedPlayers.length > 0 && (

                                        <button onClick={() => this.setState({ selectedPlayers: [] })} className="reset-button" style={{ position: 'absolute', top: '1px', right: '1px', backgroundColor: '#ff0052', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>
                                            초기화
                                        </button>
                                    )}
                                    <div className="selected-players-box" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {this.state.selectedPlayers.length > 0 ? (
                                            this.state.selectedPlayers.map((player, index) => {
                                                const tierImage = this.getTierImage(player.tier);
                                                return (
                                                    <div
                                                        key={index}
                                                        style={{ width: '22%', padding: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}
                                                        onClick={() => this.handleRemovePlayer(player.name, player.nickname)}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {tierImage && (
                                                                <img src={tierImage} alt={player.tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                            )}
                                                            <p className="player-name" style={{ margin: '2px 0', marginLeft: "5px", fontSize: '16px', color: 'white', transition: 'color 0.3s' }}
                                                                onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                                onMouseLeave={(e) => e.target.style.color = 'white'}
                                                            >{player.name}</p>
                                                        </div>
                                                        {player.nickname && (
                                                            <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p style={{ color: 'white' }}>선택된 선수가 없습니다.</p>
                                        )}
                                    </div>
                                </div>


                                <button onClick={() => this.assignTeams()} className="default-button" style={{ marginTop: '20px' }}>
                                    <span>팀 편성하기 <i className="icofont-circled-right"></i></span>
                                </button>

                            </div>

                            <div style={{ width: '100%' }}>
                                <div style={{ position: 'relative', width: '500px', margin: 'auto' }}>
                                    <h4 style={{ color: 'white', marginTop: '30px', marginBottom: '10px', textAlign: 'center' }}>A팀 선수:</h4>
                                    {this.state.teamA.length > 0 && (
                                        <button
                                            onClick={() => this.copyTeamToClipboard('A')}
                                            style={{
                                                position: 'absolute',
                                                top: '0',
                                                right: '0',
                                                padding: '10px',
                                                fontSize: '12px',
                                                backgroundColor: '#8B4513',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            복사하기
                                        </button>
                                    )}
                                    <div style={{ height: '220px', padding: '20px', border: '8px solid #232a5c', textAlign: 'center', backgroundColor: '#0a0a2a', marginBottom: '20px', overflowY: 'auto' }}>
                                        <div className="teamA-players-box" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {this.state.teamA.length > 0 ? (
                                                this.state.teamA.map((player, index) => {
                                                    return (
                                                        <div key={index} style={{ width: '19%', padding: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                                <p className="player-name" style={{ margin: '2px 0', fontSize: '16px', color: 'white', transition: 'color 0.3s' }}
                                                                    onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                                    onMouseLeave={(e) => e.target.style.color = 'white'}
                                                                >
                                                                    {player.name}
                                                                </p>
                                                                {player.nickname && (
                                                                    <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p style={{ display: 'flex', color: 'white', alignItems: 'center' }}>아직 팀이 편성되지 않았습니다.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', width: '500px', margin: 'auto' }}>
                                    <h4 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>B팀 선수:</h4>
                                    {this.state.teamB.length > 0 && (
                                        <button
                                            onClick={() => this.copyTeamToClipboard('B')}
                                            style={{
                                                position: 'absolute',
                                                top: '0',
                                                right: '0',
                                                padding: '10px',
                                                fontSize: '12px',
                                                backgroundColor: '#8B4513',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            복사하기
                                        </button>
                                    )}
                                    <div style={{ height: '220px', padding: '20px', border: '8px solid #232a5c', textAlign: 'center', backgroundColor: '#0a0a2a', overflowY: 'auto' }}>
                                        <div className="teamB-players-box" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {this.state.teamB.length > 0 ? (
                                                this.state.teamB.map((player, index) => {
                                                    return (
                                                        <div key={index} style={{ width: '19%', padding: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                                <p className="player-name" style={{ margin: '2px 0', fontSize: '16px', color: 'white', transition: 'color 0.3s' }}
                                                                    onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                                    onMouseLeave={(e) => e.target.style.color = 'white'}
                                                                >
                                                                    {player.name}
                                                                </p>
                                                                {player.nickname && (
                                                                    <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p style={{ display: 'flex', color: 'white', alignItems: 'center' }}>아직 팀이 편성되지 않았습니다.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
    renderAuctionGame() {
        return (
            <section
                className="collection-section padding-top padding-bottom"
                style={{
                    marginTop: '50px',
                    paddingTop: '10px',
                }}
            >
                <div className="container">
                    <div className="section-header">
                        <p>점수로 팀 나누기</p>
                        <h2>경매 게임</h2>
                    </div>
                    <div className="split-container" style={{ display: 'flex' }}>
                        <div className="left-container"
                            style={{
                                flex: 1,
                                marginRight: '10px',
                                padding: '20px',
                                border: '8px solid #232a5c',
                                textAlign: 'center',
                                backgroundColor: '#0a0a2a',
                            }}
                        >                            {this.state.players.length > 0 ? (
                            <div className="player-list">
                                {this.state.players.map((player, index) => {
                                    const tier = this.getTier(player.elo);
                                    const tierImage = this.getTierImage(tier);

                                    return (
                                        <div key={index} className="player-item" style={{ width: '100px', padding: '10px', margin: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}
                                            onClick={() => this.handlePlayerClick(player)}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {tierImage && (
                                                    <img src={tierImage} alt={tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                )}
                                                <p className="player-name" style={{ margin: '2px 0', marginLeft: "5px", fontSize: '20px', fontWeight: 'bold', color: 'white', transition: 'color 0.3s' }}
                                                    onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                    onMouseLeave={(e) => e.target.style.color = 'white'}
                                                >{player.name}</p>
                                            </div>
                                            {player.nickname && (
                                                <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>Loading 선수 정보...</p>
                        )}
                        </div>

                        <div className="right-container" style={{
                            flex: 1,
                            marginLeft: '10px',
                            padding: '20px',
                            border: '8px solid #232a5c',
                            textAlign: 'center',
                            backgroundImage: `url(${require('../../assets/images/blog/bg.jpg')})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start'
                        }}>
                            <h3 style={{ margin: '20px 0', marginBottom: "20px" }}>내전 팀 구성</h3>
                            <h4 style={{ color: 'white', marginTop: '10px', marginBottom: '10px' }}>참여 인원:</h4>
                            <div style={{ width: '500px', marginBottom: '20px', padding: '20px', border: '8px solid #232a5c', textAlign: 'center', backgroundColor: '#0a0a2a', overflowY: 'auto', position: 'relative' }}>
                                {this.state.selectedPlayers.length > 0 && (
                                    <button onClick={() => this.setState({ selectedPlayers: [] })} className="reset-button" style={{
                                        position: 'absolute',
                                        top: '1px',
                                        right: '1px',
                                        backgroundColor: '#ff0052',
                                        color: 'white',
                                        padding: '5px 10px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}>
                                        초기화
                                    </button>
                                )}
                                <div className="selected-players-box" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {this.state.selectedPlayers.length > 0 ? (
                                        this.state.selectedPlayers.map((player, index) => {
                                            const tierImage = this.getTierImage(player.tier);
                                            return (
                                                <div key={index} style={{ width: '22%', padding: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}
                                                    onClick={() => this.handleAssignedPlayerClick(player)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {tierImage && (
                                                            <img src={tierImage} alt={player.tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                        )}
                                                        <p className="player-name" style={{ margin: '2px 0', marginLeft: "5px", fontSize: '16px', color: 'white', transition: 'color 0.3s' }}
                                                            onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                            onMouseLeave={(e) => e.target.style.color = 'white'}
                                                        >{player.name}</p>
                                                    </div>
                                                    {player.nickname && (
                                                        <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p style={{ color: 'white' }}>참여할 인원이 없습니다.</p>
                                    )}
                                </div>
                            </div>

                            <button onClick={this.handleAuctionDraw} className="default-button" style={{ marginTop: '20px', marginBottom: '20px' }}>
                                <span>경매 매물 뽑기 <i className="icofont-circled-right"></i></span>
                            </button>

                            <div style={{
                                width: '500px',
                                marginTop: '20px',
                                marginBottom: '20px',
                                padding: '20px',
                                border: '8px solid #232a5c',
                                textAlign: 'center',
                                backgroundColor: '#0a0a2a',
                                overflowY: 'auto',
                            }}>
                                {this.state.auctionPlayers && this.state.auctionPlayers.length > 0 ? (
                                    this.state.auctionPlayers.map((player, index) => {
                                        const tierImage = this.getTierImage(player.tier);
                                        return (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', border: '1px solid #232a5c', borderRadius: '5px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {tierImage && (
                                                        <img src={tierImage} alt={player.tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                    )}
                                                    <p style={{ margin: '0 10px', fontSize: '16px', color: 'white' }}>{player.name}</p>
                                                    {player.nickname && (
                                                        <p style={{ margin: '0 10px', fontSize: '14px', color: '#999' }}>({player.nickname})</p>
                                                    )}
                                                    <p style={{ margin: '0 10px', fontSize: '14px', color: 'white' }}>ELO: {player.elo}</p>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        id="auctionPointInput"
                                                        min="0"
                                                        placeholder="0"
                                                        style={{
                                                            width: '50px',
                                                            padding: '5px',
                                                            marginRight: '5px',
                                                            textAlign: 'center',
                                                            border: '1px solid #232a5c',
                                                            borderRadius: '4px',
                                                            height: '30px'
                                                        }}
                                                    />
                                                    <span style={{ color: 'white' }}>점</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ color: 'white' }}>아직 경매 매물이 없습니다.</p>
                                )}
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: '20px'
                            }}>
                                {['내전 A팀', '내전 B팀', '내전 C팀', '내전 D팀'].map((teamName, index) => (
                                    <button
                                        key={index}
                                        onClick={(event) => this.handleAuctionAssign(index, event)}
                                        className="default-button"
                                        style={{ margin: '0 10px', marginBottom: '20px' }}
                                    >
                                        <span>{teamName}</span>
                                    </button>

                                ))}
                            </div>

                            <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {this.state.assignedPlayers.map((team, teamIndex) => (
                                    this.state.visibleTeams[teamIndex] && (
                                        <div key={teamIndex} style={{
                                            width: '500px',
                                            marginBottom: '20px',
                                            padding: '20px',
                                            border: '8px solid #232a5c',
                                            textAlign: 'center',
                                            backgroundColor: '#0a0a2a',
                                            overflowY: 'auto',
                                            position: 'relative'
                                        }}>
                                            <h4 style={{ color: 'white', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>
                                                현재 포인트: {this.state.teamPoints[teamIndex]} / 평균 ELO: {this.calculateAverageElo(team)}
                                            </h4>

                                            <button onClick={() => this.handleResetTeam(teamIndex)} style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                backgroundColor: '#ff0052',
                                                color: 'white',
                                                padding: '5px 10px',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}>
                                                초기화
                                            </button>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100px' }}>
                                                {team.map((player, slotIndex) => (
                                                    <div key={slotIndex} style={{
                                                        width: '18%',
                                                        padding: '10px',
                                                        textAlign: 'center',
                                                        backgroundColor: 'transparent',
                                                        position: 'relative',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRight: slotIndex === 0 ? '2px solid #fff' : 'none'
                                                    }}>
                                                        {player && (
                                                            <>
                                                                {this.getTierImage(player.tier) && (
                                                                    <img src={this.getTierImage(player.tier)} alt={player.tier} style={{ width: '30px', height: '30px', marginBottom: '5px' }} />
                                                                )}
                                                                <p className="player-name" style={{ margin: '2px 0', fontSize: '16px', color: 'white', transition: 'color 0.3s' }}>
                                                                    {player.name}
                                                                </p>
                                                                {slotIndex !== 0 && (
                                                                    <p style={{ margin: '2px 0', fontSize: '14px', color: 'white', transition: 'color 0.3s' }}>
                                                                        {player.points} 점
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </section>
        );
    }

    renderBalancedTeamPicker() {
        return (
            <section
                className="collection-section padding-top padding-bottom"
                style={{
                    marginTop: '50px',
                    paddingTop: '10px',
                }}
            >
                <div className="container">
                    <div className="section-header">
                        <p>{subtitle}</p>
                        <h2>밸런스 팀 뽑기</h2>
                    </div>
                    <div className="split-container" style={{ display: 'flex' }}>
                        <div className="left-container"
                            style={{
                                flex: 1,
                                marginRight: '10px',
                                padding: '20px',
                                border: '8px solid #232a5c',
                                textAlign: 'center',
                                backgroundColor: '#0a0a2a',
                            }}
                        >

                            {this.state.players.length > 0 ? (
                                <div className="player-list">
                                    {this.state.players.map((player, index) => {
                                        const tier = this.getTier(player.elo);
                                        const tierImage = this.getTierImage(tier);

                                        return (
                                            <div key={index} className="player-item" style={{ width: '100px', padding: '10px', margin: '10px', display: 'inline-block', textAlign: 'center', backgroundColor: 'transparent' }}
                                                onClick={() => this.handlePlayerClick(player)}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {tierImage && (
                                                        <img src={tierImage} alt={tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                    )}
                                                    <p className="player-name" style={{ margin: '2px 0', marginLeft: "5px", fontSize: '20px', fontWeight: 'bold', color: 'white', transition: 'color 0.3s' }}
                                                        onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                        onMouseLeave={(e) => e.target.style.color = 'white'}
                                                    >{player.name}</p>
                                                </div>
                                                {player.nickname && (
                                                    <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p>Loading 선수 정보...</p>
                            )}
                        </div>

                        <div className="right-container"
                            style={{
                                flex: 1,
                                marginLeft: '10px',
                                padding: '20px',
                                border: '8px solid #232a5c',
                                textAlign: 'center',
                                backgroundColor: '#0a0a2a',
                            }}
                        >

                            <h4 style={{ color: 'white', marginBottom: '20px', marginTop: '20px' }}>선택된 선수들:</h4>
                            <div className="selected-players-box"
                                style={{
                                    width: '500px',
                                    marginBottom: '20px',
                                    padding: '20px',
                                    border: '8px solid #232a5c',
                                    textAlign: 'center',
                                    backgroundColor: '#0a0a2a',
                                    overflowY: 'auto',
                                    position: 'relative',
                                }}
                            >
                                {this.state.selectedPlayers.length > 0 ? (
                                    <button onClick={() => this.setState({ selectedPlayers: [] })} className="reset-button"
                                        style={{
                                            position: 'absolute',
                                            top: '1px',
                                            right: '1px',
                                            backgroundColor: '#ff0052',
                                            color: 'white',
                                            padding: '5px 10px',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        초기화
                                    </button>
                                ) : null}

                                <div className="selected-players-list" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {this.state.selectedPlayers.length > 0 ? (
                                        this.state.selectedPlayers.map((player, index) => {
                                            const tierImage = this.getTierImage(player.tier);
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        width: '22%',
                                                        padding: '10px',
                                                        display: 'inline-block',
                                                        textAlign: 'center',
                                                        backgroundColor: 'transparent',
                                                    }}
                                                    onClick={() => this.handleRemovePlayer(player.playerNo)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {tierImage && (
                                                            <img src={tierImage} alt={player.tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                                        )}
                                                        <p className="player-name" style={{
                                                            margin: '2px 0',
                                                            marginLeft: "5px",
                                                            fontSize: '16px',
                                                            color: 'white',
                                                            transition: 'color 0.3s'
                                                        }}
                                                            onMouseEnter={(e) => e.target.style.color = '#ff0052'}
                                                            onMouseLeave={(e) => e.target.style.color = 'white'}
                                                        >{player.name}</p>
                                                    </div>
                                                    {player.nickname && (
                                                        <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'normal', color: '#999' }}>({player.nickname})</p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p style={{ color: 'white' }}>선택된 선수가 없습니다.</p>
                                    )}
                                </div>
                            </div>
                            <button onClick={this.assignBalancedTeams} className="default-button" style={{ marginTop: '20px' }}>
                                <span>팀 배정 <i className="icofont-circled-right"></i></span>
                            </button>

                            <h4 style={{ marginTop: '40px', color: 'white', marginBottom: '20px' }}>밸런스 팀 구성:</h4>

                            <div className="top-teams-box"
                                style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    border: '8px solid #232a5c',
                                    textAlign: 'center',
                                    backgroundColor: '#0a0a2a',
                                }}
                            >
                                {this.state.topTeams && this.state.topTeams.length > 0 ? (
                                    this.state.topTeams.map((team, index) => (
                                        <div key={index} style={{ marginBottom: '20px', padding: '20px', border: '2px solid #ff0052' }}>
                                            <div style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                                                <div style={{ marginBottom: '20px' }}>
                                                    <strong style={{ fontSize: '18px', display: 'block', marginBottom: '10px' }}>
                                                        {team.groupName.includes("상위") ? "A팀(상위 경기)" : team.groupName.includes("하위") ? "A팀(하위 경기)" : "A팀"}
                                                    </strong>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                                        {team.teamA.map((player, idx) => (
                                                            <div key={idx} style={{ textAlign: 'center' }}>
                                                                <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>{player.name}</p>
                                                                {player.nickname && (
                                                                    <p style={{ margin: '0', fontSize: '14px', color: '#999' }}>({player.nickname})</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '18px', display: 'block', marginBottom: '10px' }}>
                                                        {team.groupName.includes("상위") ? "B팀(상위 경기)" : team.groupName.includes("하위") ? "B팀(하위 경기)" : "B팀"}
                                                    </strong>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                                        {team.teamB.map((player, idx) => (
                                                            <div key={idx} style={{ textAlign: 'center' }}>
                                                                <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>{player.name}</p>
                                                                {player.nickname && (
                                                                    <p style={{ margin: '0', fontSize: '14px', color: '#999' }}>({player.nickname})</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ color: 'white', textAlign: 'center' }}>
                                                <strong>A팀 Elo 평균:</strong> {team.teamAElo.toFixed(2)} <br />
                                                <strong>B팀 Elo 평균:</strong> {team.teamBElo.toFixed(2)} <br />
                                                <strong>Elo 편차:</strong> {team.eloDifference.toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: 'white' }}>이상적인 팀 구성이 없습니다.</p>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }


    render() {
        const { activeTab } = this.state;

        return (
            <div style={{
                backgroundImage: `url(${require('../../assets/images/match/bg.jpg')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '100vh',
            }}>
                <nav
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "20px 0",
                        marginTop: "40px",
                    }}
                >
                    <button
                        onClick={() => this.handleTabChange("balancedTeam")}
                        style={{
                            color: activeTab === "balancedTeam" ? "#ff0052" : "#fff",
                            border: "none",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "20px",
                            borderRadius: "5px",
                            margin: "0 10px",
                            transition: "background-color 0.3s",
                            fontWeight: "bold",
                            marginTop: "100px",
                        }}
                    >
                        밸런스 팀 뽑기
                    </button>
                    <button
                        onClick={() => this.handleTabChange("ladderGame")}
                        style={{
                            color: activeTab === "ladderGame" ? "#ff0052" : "#fff",
                            border: "none",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "20px",
                            borderRadius: "5px",
                            margin: "0 10px",
                            transition: "background-color 0.3s",
                            fontWeight: "bold",
                            marginTop: "100px",
                        }}
                    >
                        사다리 게임
                    </button>
                    <button
                        onClick={() => this.handleTabChange("auctionGame")}
                        style={{
                            color: activeTab === "auctionGame" ? "#ff0052" : "#fff",
                            border: "none",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "20px",
                            borderRadius: "5px",
                            margin: "0 10px",
                            transition: "background-color 0.3s",
                            fontWeight: "bold",
                            marginTop: "100px",
                        }}
                    >
                        경매 게임
                    </button>

                </nav>

                <div style={{ width: "100%", textAlign: "center" }}>
                    <hr
                        style={{
                            margin: "20px auto",
                            border: "none",
                            borderTop: "1px solid #white",
                            width: "10%",
                        }}
                    />
                </div>

                {activeTab === "ladderGame"
                    ? this.renderLadderGame()
                    : activeTab === "auctionGame"
                        ? this.renderAuctionGame()
                        : activeTab === "balancedTeam"
                            ? this.renderBalancedTeamPicker()
                            : null}
            </div>
        );
    }
}

export default RandomLadder;