import { Component, Fragment, useState } from "react";
import { db } from "../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";

const PlayerInfo = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [tier, setTier] = useState("");
  const [mainPosition, setMainPosition] = useState("");
  const [secondaryPosition, setSecondaryPosition] = useState("");

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

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
  };

  const handleTierChange = (e) => {
    setTier(e.target.value);
  };

  const handleMainPositionChange = (e) => {
    setMainPosition(e.target.value);
  };
  
  const handleSecondaryPositionChange = (e) => {
    setSecondaryPosition(e.target.value);
  };

  const handleSavePlayer = async () => {
    if (!name || !nickname || !tier) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    const eloMapping = {
      "그랜드마스터": 2500,
      "마스터": 2300,
      "다이아": 2125,
      "에메랄드": 1875,
      "플레티넘": 1625,
      "골드": 1375,
      "실버": 1125,
      "브론즈": 875,
      "아이언": 625,
    };

    const elo = eloMapping[tier];

    try {
      const querySnapshot = await getDocs(collection(db, "선수 정보"));
      const playerNos = querySnapshot.docs.map((doc) => doc.data().playerNo);
      const nextPlayerNo = playerNos.length > 0 ? Math.max(...playerNos) + 1 : 1;

      await addDoc(collection(db, "선수 정보"), {
        name,
        nickname,
        elo,
        playerNo: nextPlayerNo,
        mainPosition,
        secondaryPosition,
      });
      alert("선수 정보가 저장되었습니다!");
      setName("");
      setNickname("");
      setTier("");
    } catch (error) {
      console.error("Error saving player data: ", error);
      alert("선수 정보 저장 중 오류가 발생했습니다.");
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
                            <h3 style={{ color: 'white' }}>선수 정보 입력</h3>
                            <div style={{ marginTop: '15px' }}>
                              <input
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="이름 입력"
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white', marginBottom: '10px' }}
                              />
                              <input
                                type="text"
                                value={nickname}
                                onChange={handleNicknameChange}
                                placeholder="닉네임 입력"
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white', marginBottom: '10px' }}
                              />
                              <select
                                value={tier}
                                onChange={handleTierChange}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white', backgroundColor: '#1A223F', marginBottom: '10px' }}
                              >
                                <option value="" style={{ color: 'white' }}>티어 선택</option>
                                <option value="아이언" style={{ color: 'white' }}>아이언</option>
                                <option value="브론즈" style={{ color: 'white' }}>브론즈</option>
                                <option value="실버" style={{ color: 'white' }}>실버</option>
                                <option value="골드" style={{ color: 'white' }}>골드</option>
                                <option value="플레티넘" style={{ color: 'white' }}>플레티넘</option>
                                <option value="에메랄드" style={{ color: 'white' }}>에메랄드</option>
                                  <option value="다이아" style={{ color: 'white' }}>다이아</option>
                                  <option value="마스터" style={{ color: 'white' }}>마스터</option>
                                  <option value="그랜드마스터" style={{ color: 'white' }}>그랜드마스터</option>
                                </select>
                                <select
                                  value={mainPosition}
                                  onChange={handleMainPositionChange}
                                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white', backgroundColor: '#1A223F', marginBottom: '10px' }}
                                >
                                  <option value="">주 라인 선택</option>
                                  <option value="탑">탑</option>
                                  <option value="정글">정글</option>
                                  <option value="미드">미드</option>
                                  <option value="원딜">원딜</option>
                                  <option value="서폿">서폿</option>
                                </select>
                                <select
                                  value={secondaryPosition}
                                  onChange={handleSecondaryPositionChange}
                                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', color: 'white', backgroundColor: '#1A223F', marginBottom: '10px' }}
                                >
                                  <option value="">부 라인 선택</option>
                                  <option value="탑">탑</option>
                                  <option value="정글">정글</option>
                                  <option value="미드">미드</option>
                                  <option value="원딜">원딜</option>
                                  <option value="서폿">서폿</option>
                                </select>
                              </div>
                              <button onClick={handleSavePlayer} className="default-button" style={{ marginTop: '20px' }}>
                                <span>선수 정보 저장</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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