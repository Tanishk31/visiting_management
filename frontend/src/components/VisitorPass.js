 import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const VisitorPass = ({ visit }) => {
    const { name, company, purpose, checkIn, photo, contact, _id } = visit;
    const checkInDate = new Date(checkIn).toLocaleString();

    return (
        <div className="visitor-pass">
            <div className="pass-header">
                <h2>VISITOR PASS</h2>
                <div className="pass-validity">Valid: {checkInDate}</div>
            </div>
            
            <div className="pass-content">
                <div className="pass-photo">
                    {photo && (
                        <img 
                            src={`http://localhost:5000/${photo}`} 
                            alt="Visitor" 
                        />
                    )}
                </div>
                
                <div className="pass-details">
                    <div className="detail-row">
                        <span className="label">Name:</span>
                        <span className="value">{name}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Company:</span>
                        <span className="value">{company}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Purpose:</span>
                        <span className="value">{purpose}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Contact:</span>
                        <span className="value">{contact}</span>
                    </div>
                </div>

                <div className="pass-qr">
                    <QRCodeSVG
                        value={JSON.stringify({
                            id: _id,
                            name,
                            checkIn
                        })}
                        size={128}
                        level="H"
                        includeMargin={true}
                    />
                </div>
            </div>

            <div className="pass-footer">
                <p>Please keep this pass with you at all times</p>
                <p>Valid for today only</p>
            </div>
        </div>
    );
};

export default VisitorPass;