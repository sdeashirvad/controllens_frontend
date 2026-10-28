import { NavLink, Outlet } from 'react-router-dom'
import { DemoDataBanner } from './DemoDataBanner'

export function AppShell() {
  return (
    <div className="app">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <div className="brand-name">ControlLens</div>
            <div className="brand-sub">Technology Risk Intelligence</div>
          </div>
        </div>
        <nav className="side-nav" aria-label="Primary">
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/metrics">Metric register</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/architecture">Architecture</NavLink>
        </nav>
        <div className="sidebar-foot">
          <div>Policy Control Office</div>
          <div>Stakeholder demonstration</div>
        </div>
      </aside>
      <div className="main-col">
        <DemoDataBanner />
        <div id="content" className="content" tabIndex={-1}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
