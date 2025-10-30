const master = require('../models/master');

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
