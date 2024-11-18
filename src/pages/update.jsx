import { Fragment, useState } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import EloUpdate from "../component/api/eloUpdate";
import ChampUpdate from "../component/api/champUpdate";

const Update = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");

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

  const handleEloUpdate = async () => {
    await EloUpdate();
  };

  const handleChampUpdate = async () => {
    await ChampUpdate();
  };

  return (
    <Fragment>
      <Header />
      <PageHeader title={'정보 갱신'} curPage={'Website Update'} />
      <div className="blog-section padding-top padding-bottom">
        <div className="container">
          <div className="section-wrapper text-center">
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                <button onClick={handleEloUpdate} className="default-button">
                  <span>ELO 정보 갱신</span>
                </button>
                <button onClick={handleChampUpdate} className="default-button">
                  <span>챔피언 정보 갱신</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </Fragment>
  );
};

export default Update;