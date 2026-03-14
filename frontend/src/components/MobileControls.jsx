import { useEffect, useRef } from 'react';
import { input } from '../game/input';

import '../assets/style/components/MobileControls.css';

const JOYSTICK_RADIUS = 52;
const KNOB_RADIUS = 24;
const DEAD_ZONE = 0.18;

export default function MobileControls() {
    const joystickRef = useRef(null);
    const knobRef = useRef(null);
    const stateRef = useRef({
        active: false,
        touchId: null,
        originX: 0,
        originY: 0,
    });

    useEffect(() => {
        const el = joystickRef.current;
        if (!el) return;

        function onTouchStart(e) {
            // Only react to the first unused touch in our zone
            for (const t of e.changedTouches) {
                if (stateRef.current.active) break;
                const rect = el.getBoundingClientRect();
                // Anchor the joystick base at the touch origin
                stateRef.current = {
                    active: true,
                    touchId: t.identifier,
                    originX: t.clientX - rect.left,
                    originY: t.clientY - rect.top,
                };
                _moveKnob(0, 0);
                break;
            }
            e.preventDefault();
        }

        function onTouchMove(e) {
            const s = stateRef.current;
            if (!s.active) return;
            for (const t of e.changedTouches) {
                if (t.identifier !== s.touchId) continue;
                const rect = el.getBoundingClientRect();
                const dx = (t.clientX - rect.left) - s.originX;
                const dy = (t.clientY - rect.top) - s.originY;
                _applyJoystick(dx, dy);
                break;
            }
            e.preventDefault();
        }

        function onTouchEnd(e) {
            const s = stateRef.current;
            for (const t of e.changedTouches) {
                if (t.identifier !== s.touchId) continue;
                stateRef.current.active = false;
                stateRef.current.touchId = null;
                _applyJoystick(0, 0);
                _moveKnob(0, 0);
                break;
            }
            e.preventDefault();
        }

        el.addEventListener('touchstart', onTouchStart, { passive: false });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd, { passive: false });
        el.addEventListener('touchcancel', onTouchEnd, { passive: false });

        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchEnd);
        };
    }, []);

    function _applyJoystick(dx, dy) {
        const dist = Math.hypot(dx, dy);
        const clamped = Math.min(dist, JOYSTICK_RADIUS);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;

        _moveKnob(nx * clamped, ny * clamped);

        const threshold = JOYSTICK_RADIUS * DEAD_ZONE;
        input.keys.left = dx < -threshold;
        input.keys.right = dx > threshold;
        input.keys.up = dy < -threshold;
        input.keys.down = dy > threshold;
    }

    function _moveKnob(offsetX, offsetY) {
        const knob = knobRef.current;
        if (!knob) return;
        knob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    }

    useEffect(() => {
        const aimTouches = new Map();

        function onTouchStart(e) {
            for (const t of e.changedTouches) {
                if (t.clientX < window.innerWidth / 2) continue;
                aimTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
                input.mouse = { x: t.clientX, y: t.clientY };
                input.mouseDown = true;
            }
            if ([...e.changedTouches].some(t => t.clientX <= window.innerWidth / 2)) {
                e.preventDefault();
            }
        }

        function onTouchMove(e) {
            for (const t of e.changedTouches) {
                if (!aimTouches.has(t.identifier)) continue;
                aimTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
                input.mouse = { x: t.clientX, y: t.clientY };
            }
        }

        function onTouchEnd(e) {
            for (const t of e.changedTouches) {
                if (!aimTouches.has(t.identifier)) continue;
                aimTouches.delete(t.identifier);
            }
            if (aimTouches.size === 0) input.mouseDown = false;
        }

        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('touchcancel', onTouchEnd, { passive: false });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            document.removeEventListener('touchcancel', onTouchEnd);
        };
    }, []);

    return (
        <div className="mobile-controls">

            {/* Left zone — joystick */}
            <div className="mobile-zone mobile-zone-left" ref={joystickRef}>
                <div className="joystick-ring">
                    {/* Cardinal direction hints */}
                    <span className="joystick-hint joystick-hint-top">▲</span>
                    <span className="joystick-hint joystick-hint-bottom">▼</span>
                    <span className="joystick-hint joystick-hint-left">◄</span>
                    <span className="joystick-hint joystick-hint-right">►</span>
                    {/* Knob */}
                    <div className="joystick-knob" ref={knobRef} />
                </div>
            </div>

            {/* Right zone — aim / fire */}
            <div className="mobile-zone mobile-zone-right">
                <div className="aim-hint">
                    <svg viewBox="0 0 40 40" width="40" height="40">
                        <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                        <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.6" />
                        <line x1="20" y1="2" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="20" y1="30" x2="20" y2="38" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="2" y1="20" x2="10" y2="20" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="30" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span>tap &amp; drag to aim</span>
                </div>
            </div>
        </div>
    );
}