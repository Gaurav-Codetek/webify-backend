const master = require('../models/master');
const domainShelf = require('../models/domainShelf');
const axios = require("axios");

exports.newProject = async (req, res) => {
  const { githubId } = req.params;
  const projectData = req.body;

  try {
    const userDoc = await master.findOne({ gitId: githubId });

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract owner and repo name from repo_url
    // Example: https://github.com/Gaurav-Codetek/campus-ai.git
    const match = projectData.repository.match(/github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) {
      return res.status(400).json({ message: "Invalid GitHub repository URL" });
    }

    const owner = match[1];
    const repo = match[2];
    const branch = projectData.branch || "main";

    // Fetch latest commit info from GitHub API
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`;
    const commitResponse = await axios.get(commitUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "WebifyApp",
      },
    });

    const commitData = commitResponse.data;
    const latestCommit = {
      id: commitData.sha,
      message: commitData.commit.message,
    };

    // Format current date/time (IST)
    const now = new Date();
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    };
    const formattedDate = now.toLocaleString("en-IN", options).replace(",", "");

    // Add commit info + date
    projectData.commit = latestCommit;
    projectData.date = formattedDate;

    // Assign project number
    const prsize = userDoc.projects.length + 1;
    projectData.prno = prsize;

    // Push new project into user's projects array
    const result = await master.updateOne(
      { gitId: githubId },
      { $push: { projects: projectData } },
      { upsert: false }
    );

    console.log("Project added:", result);

    res.status(200).json({
      message: "Project added successfully",
      projectNumber: prsize,
      commit: latestCommit,
      date: formattedDate,
    });
  } catch (err) {
    console.error("Error creating project:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to create project",
      details: err.response?.data?.message || err.message,
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
