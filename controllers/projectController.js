const master = require('../models/master');
const domainShelf = require('../models/domainShelf');
const axios = require("axios");
const jwt = require("jsonwebtoken");

exports.newProject = async (req, res) => {
  const { githubId } = req.params;
  const projectData = req.body;

  try {
    // 1️⃣ Find user document
    const userDoc = await master.findOne({ gitId: githubId });
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Prepare project numbering
    const prsize = userDoc.projects.length + 1;
    projectData.prno = prsize;

    // 3️⃣ Extract repo owner, name, and branch
    const repoUrl = projectData.repo_url.replace(/\.git$/, "");
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return res.status(400).json({ message: "Invalid repo URL" });

    const owner = match[1];
    const repo = match[2];
    const branch = projectData.branch || "main";

    // 4️⃣ Generate JWT for the GitHub App
    const privateKey = Buffer.from(process.env.GITHUB_PEM, "base64").toString("utf8");
    const appJWT = jwt.sign(
      {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
        iss: process.env.GITHUB_APP_ID
      },
      privateKey,
      { algorithm: "RS256" }
    );

    // 5️⃣ Exchange for Installation Access Token
    const installationId = userDoc.installationId;
    if (!installationId)
      return res.status(400).json({ message: "GitHub installation not found for this user" });

    const installRes = await axios.post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      {
        headers: {
          Authorization: `Bearer ${appJWT}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const installationToken = installRes.data.token;

    // 6️⃣ Fetch latest commit for that branch
    const commitsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
      {
        headers: {
          Authorization: `Bearer ${installationToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "WebifyApp"
        }
      }
    );

    const latestCommit = commitsRes.data;
    const commitId = latestCommit.sha;
    const commitMessage = latestCommit.commit.message;

    // 7️⃣ Format date & time
    const now = new Date();
    const formattedDate = now.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    }) + ` ${now.getDate()} ${now.toLocaleString("en-IN", { month: "short" })} ${now.getFullYear()}`;

    // 8️⃣ Add commit info and date to projectData
    projectData.commit = commitId
    projectData.commitMsg = commitMessage
    projectData.date = formattedDate

    // 9️⃣ Save to DB
    await master.updateOne(
      { gitId: githubId },
      { $push: { projects: projectData } },
      { upsert: false }
    );

    res.status(200).json({
      message: "Project added successfully",
      projectNumber: prsize,
      commit: projectData.latestCommit
    });
  } catch (err) {
    console.error("❌ Error creating project:", err.response?.data || err.message);
    res.status(500).json({
      error: "Project creation failed",
      details: err.response?.data || err.message
    });
  }
};


exports.deleteProject = async (req, res) => {
  const { githubId, prname } = req.params;

  try {
    // Check if user exists
    const userDoc = await master.findOne({ gitId: githubId });
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the project to delete
    const projectDoc = userDoc.projects.find((proj) => proj.prname === prname);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Extract domain safely
    const domain = projectDoc.subdomainurl.split('.')[0];

    // Remove the project from user's projects
    const result = await master.updateOne(
      { gitId: githubId },
      { $pull: { projects: { prname } } }
    );

    // Remove the domain from domainShelf
    const domainResult = await domainShelf.updateOne(
      {},
      { $pull: { domain: { domainName: domain } } }
    );

    // Check if anything was modified
    if (result.modifiedCount === 0 && domainResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Nothing was deleted' });
    }

    res.status(200).json({ message: 'Project and domain removed successfully' });

  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete project', details: err.message });
  }
};



exports.getEnv = async (req, res) => {
  try {
    const { username, prname } = req.body;

    const masterDoc = await master.findOne({ gitId: username });

    if (!masterDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const projectDoc = masterDoc.projects.find((proj) => proj.prname === prname);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(projectDoc);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
}


exports.updateEnv = async (req, res) => {
  try {
    const { username, prname, env } = req.body;

    const masterDoc = await master.findOne({ gitId: username });

    if (!masterDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const projectIndex = masterDoc.projects.findIndex(
      (proj) => proj.prname === prname
    );

    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // ✅ Update the env field
    masterDoc.projects[projectIndex].env = env;

    // ✅ Save the document
    await masterDoc.save();

    return res.status(200).json({
      message: 'Environment updated successfully',
      updatedProject: masterDoc.projects[projectIndex],
    });
  } catch (err) {
    console.error('Error updating env:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllProject = async (req, res) => {
  const { githubId } = req.params;

  try {
    const result = await master.findOne({ gitId: githubId });

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Project updated successfully', data: result });
  }
  catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

exports.getProject = async (req, res) => {
  const { githubId, prname } = req.params;

  try {
    const masterDoc = await master.findOne({ gitId: githubId });

    if (!masterDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const projectDoc = masterDoc.projects.find((proj) => proj.prname === prname);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({ message: 'project found!', data: projectDoc });
  }
  catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};
