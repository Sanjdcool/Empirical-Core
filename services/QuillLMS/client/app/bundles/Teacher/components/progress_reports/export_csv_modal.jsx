import React from 'react'

const ExportCSVModal = (
  {
    email,
  },
) => {
  return (
    <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <button aria-label="Close" className="close" data-dismiss="modal" type="button"><span aria-hidden="true"><i className="fas fa-close" /></span></button>
            <h4 className="modal-title"><strong>Your reports are on the way!</strong></h4>
          </div>
          <div className="modal-body csv-email-modal">
            <p>Your Quill Progress Report is on its way! This table is being emailed to you as a CSV spreadsheet, which can be opened with Google Sheets or Excel. It should arrive within the next five minutes.</p>
            <p>Please Check: <strong>{email}</strong></p>
            <p>If you do not receive an email within 10 minutes, please check your spamfolder. You may also change the email we have on file by visiting <strong><a href="https://www.quill.org/teachers/my_account">My Account.</a></strong></p>
          </div>
          <div className="modal-footer">
            <button className="button-green" data-dismiss="modal" type="button">Got It</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCSVModal;
