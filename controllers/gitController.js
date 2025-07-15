const axios = require('axios');

exports.getUserRepos = async (req, res) => {
  try {
    const { accessToken } = req.user;

    const response = await axios.get('https://api.github.com/user/repos?per_page=100', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'WebifyApp'
      },
      withCredentials:'true'
    });

    const repos = response.data.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private
    }));

    res.status(200).json(repos);
  } catch (err) {
    console.error('GitHub repo fetch error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
};

exports.createWebhook = async (req, res) => {
  const { webhookUrl, owner, repo } = req.body;
  const { accessToken } = req.user;
  const config = {
    url: `https://api.github.com/repos/${owner}/${repo}/hooks`,
    method: "post",
    withCredentials:true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    data: {
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url: webhookUrl,
        content_type: "json",
        insecure_ssl: "0"
      }
    }
  }
  console.log(accessToken);
  try {
    const response = await axios(config);
    console.log("✅ Webhook created successfully!");
    console.log(response.data);
    res.status(200).json({ data: response.data, message: "Webhook created!" });

  } catch (error) {
    console.error("❌ Failed to create webhook:", error.response?.data || error.message);
    console.log(error);
    throw error;
  }
}