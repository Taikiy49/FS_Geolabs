import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/GitHubRepoWidget.css';

const GitHubRepoWidget = ({ username = 'taikiyamashita', repo = 'FS_Geolabs' }) => {
  const [repoInfo, setRepoInfo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repoRes, commitsRes, userRes] = await Promise.all([
          axios.get(`https://api.github.com/repos/${username}/${repo}`),
          axios.get(`https://api.github.com/repos/${username}/${repo}/commits`),
          axios.get(`https://api.github.com/users/${username}`),
        ]);
        setRepoInfo(repoRes.data);
        setCommits(commitsRes.data.slice(0, 10));
        setUserInfo(userRes.data);
      } catch (err) {
        console.error('Error fetching GitHub data:', err);
      }
    };
    fetchData();
  }, [username, repo]);

  if (!repoInfo || !userInfo) return null;

  return (
    <div className="github-widget-container">
      <div className="github-header">
        <img className="github-avatar" src={userInfo.avatar_url} alt="GitHub Avatar" />
        <div>
          <h2 className="github-title">
            <a href={repoInfo.html_url} target="_blank" rel="noreferrer">
              {repoInfo.name}
            </a>
          </h2>
          <p className="github-desc">{repoInfo.description}</p>
          <div className="github-stats">
            ⭐ {repoInfo.stargazers_count} &nbsp;|&nbsp; 🍴 {repoInfo.forks_count} &nbsp;|&nbsp; 🕒 Updated {new Date(repoInfo.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="github-commits">
        <h3 className="commit-title">Recent Commits</h3>
        <div>
        {commits.map((commit, index) => (
            <div key={index} className="commit-item">

              <div className="commit-message">{commit.commit.message.split('\n')[0]}</div>
              <div className="commit-meta">
                by {commit.commit.author.name} — {new Date(commit.commit.author.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GitHubRepoWidget;
