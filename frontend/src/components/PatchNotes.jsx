import { useState, useMemo, useEffect, useRef } from 'react';
import '../assets/style/components/NavBar.css';
import '../assets/style/components/PatchNotes.css';
import commitData from "../commits.json"
import { sha256 } from 'js-sha256';

const LOCAL_STORAGE_ITEM = "swarm_last_update"
const TYPE_ORDER = ['feat!', 'feat', 'fix', 'ref'];
const TYPE_NAMES = {
    "feat!": "Major changes",
    "feat": "New features",
    "fix": "Fixes",
    "ref": "Refactor",
}

export function PatchNotes() {
    const [isOpen, setIsOpen] = useState(false);
    const [newUpdates, setNewUpdates] = useState(false)
    const containerRef = useRef(null);

    const toggleOpen = () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        
        if (nextOpen && newUpdates) {
            setNewUpdates(false);
            const last_commit_hash = sha256(JSON.stringify(commitData[0]));
            localStorage.setItem(LOCAL_STORAGE_ITEM, last_commit_hash);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        const checkNewUpdates = () => {
            const localStorageData = localStorage.getItem(LOCAL_STORAGE_ITEM)

            const last_commit_hash = sha256(JSON.stringify(commitData[0]))
            // last update is stored as sha256
            if (!localStorageData) return localStorage.setItem(LOCAL_STORAGE_ITEM, last_commit_hash)
            
            // else check stored commit with last one
            if (localStorageData == last_commit_hash) return

            // else new updates are available, show exclamation mark
            setNewUpdates(true)
        }

        checkNewUpdates()
    }, [newUpdates, setNewUpdates])

    const groupedCommits = useMemo(() => {
        const groups = {};
        
        commitData.forEach(commit => {
            const { date, type } = commit;
            if (!groups[date]) groups[date] = {};
            if (!groups[date][type]) groups[date][type] = [];
            groups[date][type].push(commit);
        });
        
        return groups;
    }, []);

    return (
        <div className="patch-notes-container" ref={containerRef}>
            {newUpdates ? <span className="nav-badge">!</span>: ""}
            {isOpen && (
                <div className="patch-notes-modal">
                    <div className="patch-notes-title">Patch Notes</div>
                    <div className="patch-notes-content">
                        {Object.entries(groupedCommits).map(([date, types], dateIndex) => (
                            <div key={dateIndex} className="patch-date-group">
                                <div className="patch-date-header">{date}</div>
                                {TYPE_ORDER.map(type => {
                                    const commits = types[type];
                                    if (!commits || commits.length === 0) return null;
                                    
                                    return (
                                        <div key={type} className="patch-type-subgroup">
                                            <div className={`patch-type-header ${type}`}>{TYPE_NAMES[type]}</div>
                                            {commits.map((commit, index) => (
                                                <div key={index} className="patch-item">
                                                    <span className="patch-message">• {commit.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <button className="patch-notes-button" onClick={toggleOpen}>
                {isOpen ? 'Close' : 'Patch Notes'}
            </button>
        </div>
    );
}
