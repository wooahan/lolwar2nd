import { Component } from "react";

const subtitle = "랜덤 룰렛";
const title = "선/후 팀 정하기";

class AboutSection extends Component {
    assignTeams = () => {
        const teams = ["A팀", "B팀"];
        const result = teams[Math.floor(Math.random() * teams.length)];
        
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
        const formattedTime = now.toLocaleTimeString("en-US", {
            hour12: true,
        });

        const resultText = `${formattedDate} ${formattedTime} 룰렛 돌리기 결과: ${result}`;

        navigator.clipboard.writeText(resultText).then(() => {
            alert("룰렛 돌리기 결과가 복사되었습니다.");
        });
    };

    render() { 
        const { imgUrl } = this.props;
        return (
            <section className="about-section">
                <div className="container">
                    <div className="section-wrapper padding-top">
                        <div className="row align-items-center justify-content-center">
                            <div className="col-lg-6 text-center">
                                <div className="about-image">
                                    <img src={imgUrl} alt="about-image" />
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-10 d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '100%' }}>
                                <div className="about-wrapper d-flex flex-column align-items-center justify-content-center" style={{ height: '100%', maxWidth: '600px', width: '100%' }}>
                                    <div className="section-header">
                                        <p className="text-center">{subtitle}</p>
                                        <h2 className="text-center">{title}</h2>
                                    </div>
                                    <div className="about-content">
                                        <button onClick={this.assignTeams} className="default-button" style={{ marginTop: '20px' }}>
                                            <span>룰렛 돌리기 <i className="icofont-circled-right"></i></span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}

export default AboutSection;
