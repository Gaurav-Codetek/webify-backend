const master = require('../models/master');
const domainShelf = require('../models/domainShelf');

exports.newProject = async (req, res) => {
  const { githubId } = req.params;
  const projectData = req.body; // or just req.body if you're sending flat JSON

  try {
    const userDoc = await master.findOne({ gitId: githubId });

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const prsize = userDoc.projects.length + 1;
    projectData.prno = prsize;

    const result = await master.updateOne(
      { gitId: githubId },
      { $push: { projects: projectData } },
      { upsert: false }
    );

    console.log(result);

    res.status(200).json({ message: 'Project added successfully', projectNumber: prsize });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
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
