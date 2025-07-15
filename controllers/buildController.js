const domainShelf = require('../models/domainShelf');
const master = require('../models/master');

exports.newBuild = async (req, res) => {
    const { githubId, prname } = req.params;
    const newBuildEntry = req.body;

    try {
        const masterDoc = await master.findOne({ gitId: githubId });
        if (!masterDoc) {
            return res.status(404).json({ message: 'User not found' });
        }

        const projectDoc = masterDoc.projects.find(
            (proj) => proj.prname === prname
        );

        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const size = projectDoc.buildData.length + 1;
        newBuildEntry.blno = size;
        newBuildEntry.blname = `${newBuildEntry.blname}${newBuildEntry.blno}`
        projectDoc.buildData.push(newBuildEntry);


        await masterDoc.save();

        res.status(200).json({ message: 'Build added successfully', buildData: projectDoc.buildData });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', details: err.message });
    }
};

exports.getBuild = async (req, res) => {
    const { githubId, prname, blname } = req.params;

    try {
        const masterDoc = await master.findOne({ gitId: githubId });
        if (!masterDoc) {
            return res.status(404).json({ message: 'User not found' });
        }

        const projectDoc = masterDoc.projects.find(
            (proj) => proj.prname === prname
        );

        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const buildDoc = projectDoc.buildData.find((build) => build.blname = blname);

        if (!buildDoc) {
            return res.status(404).json({ message: "Build not found" });
        }

        return res.status(200).json({ message: "Build found", data: buildDoc });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', details: err.message });
    }
};

exports.getAllBuild = async (req, res) => {
    const { githubId, prname } = req.params;

    try {
        const masterDoc = await master.findOne({gitId: githubId });
        if (!masterDoc) {
            return res.status(404).json({ message: 'User not found' });
        }

        const projectDoc = masterDoc.projects.find(
            (proj) => proj.prname === prname
        );

        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const buildDoc = projectDoc.buildData;

        if (!buildDoc) {
            return res.status(404).json({ message: "Build not found" });
        }

        return res.status(200).json({ message: "Build found", data: buildDoc });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', details: err.message });
    }
};

exports.domainValidation = async (req, res) => {
    let { domain } = req.params;

    try {
        if (!domain || typeof domain !== 'string') {
            return res.status(400).json({ message: "Domain must be a non-empty string" });
        }

        domain = domain.trim().toLowerCase();

        const validDomainRegex = /^[a-z0-9-]{3,30}$/;
        if (!validDomainRegex.test(domain)) {
            return res.status(400).json({
                message: "Invalid domain name. Only lowercase letters, numbers, and hyphens are allowed (3-30 chars)."
            });
        }

        const existing = await domainShelf.findOne({
            domain: {
                $elemMatch: {
                    domainName: new RegExp(`^${domain}$`, 'i')
                }
            }
        });

        if (existing) {
            return res.status(200).json({
                message: "Domain already taken",
                available: false
            });
        }

        return res.status(200).json({
            message: "Domain is available to use",
            available: true
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};


exports.domainRegister = async (req, res) => {
    const { domain } = req.body;
    try {
        console.log(domain);
        const domainObject = {
            domainName: domain,
            createdAt: new Date() // <-- Add current timestamp
        };
        const list = await domainShelf.updateOne({},
            { $push: { domain: domainObject } }
        )

        if (!list) {
            res.status(404).json({ message: "Domain registration failed! Please try gain later.." });
        }

        res.status(200).json({ message: "Domain registered successfully!" });
    } catch (err) {
        console.log(err);
    }
}