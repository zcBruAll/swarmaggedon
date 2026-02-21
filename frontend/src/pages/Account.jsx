import './Account.css'

const Account = () => (
  <div id="section-account" className="section-content active">
    <div className="main" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '900px' }}>
      <div className="panel" style={{ gridColumn: '1/-1' }}>
        <div className="panel-header">
          <span className="panel-title">Account details</span>
          <span className="tag tag-accent">ghost_451</span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          <div>
            <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>— profile —</div>
            <div className="account-field">
              <div className="label">username</div>
              <div className="account-field-row">
                <input type="text" defaultValue="ghost_451" />
                <button className="btn btn-outline btn-sm">update</button>
              </div>
            </div>
            <div className="account-field">
              <div className="label">email</div>
              <div className="account-field-row">
                <input type="email" defaultValue="ghost451@example.com" />
              </div>
            </div>
            <div className="account-field">
              <div className="label">display name</div>
              <div className="account-field-row">
                <input type="text" defaultValue="Ghost" />
                <button className="btn btn-outline btn-sm">update</button>
              </div>
            </div>
            <div className="account-field">
              <div className="label">country</div>
              <select defaultValue="Switzerland">
                <option>Switzerland</option>
                <option>France</option>
                <option>Germany</option>
                <option>United States</option>
              </select>
            </div>
          </div>
          <div>
            <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>— security —</div>
            <div className="account-field">
              <div className="label">current password</div>
              <input type="password" placeholder="••••••••" />
            </div>
            <div className="account-field">
              <div className="label">new password</div>
              <input type="password" placeholder="••••••••" />
            </div>
            <div className="account-field">
              <div className="label">confirm new password</div>
              <input type="password" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-sm mt-8">Change password</button>
            <hr className="divider" />
            <div className="label" style={{ fontSize: '14px', color: 'var(--red)' }}>— danger zone —</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button className="btn btn-danger btn-sm">Delete account</button>
              <button className="btn btn-outline btn-sm">Log out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Account;
