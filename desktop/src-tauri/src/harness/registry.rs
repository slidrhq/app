//! The built-in harnesses: the one place outside an adapter's own file that names concrete
//! adapters; and the agents of the organization's own, which its system settings name (AGT-04,
//! ADR-117).

use std::sync::Arc;

use super::{AgentHarness, mock::MockHarness};
use crate::system_settings::Policy;

// Declared here rather than in `mod.rs`, so the generic layer does not name it.
#[path = "claude_code.rs"]
mod claude_code;
#[path = "custom_cli.rs"]
mod custom_cli;
#[path = "one_shot.rs"]
pub(super) mod one_shot;

/// Set to offer the scripted mock harness in a release build (end-to-end tests).
const MOCK_ENV: &str = "SLIDR_AGENT_MOCK";

/// The harnesses the app offers, in display order. The mock is offered in debug builds, or in
/// any build when `SLIDR_AGENT_MOCK` is set.
pub fn builtin() -> Vec<Arc<dyn AgentHarness>> {
    let mut harnesses: Vec<Arc<dyn AgentHarness>> =
        vec![Arc::new(claude_code::ClaudeCodeHarness::new())];
    harnesses.push(Arc::new(one_shot::OneShotHarness::codex()));
    harnesses.push(Arc::new(one_shot::OneShotHarness::copilot()));
    harnesses.push(Arc::new(one_shot::OneShotHarness::gemini()));
    harnesses.push(Arc::new(one_shot::OneShotHarness::grok()));
    if cfg!(debug_assertions) || std::env::var_os(MOCK_ENV).is_some() {
        harnesses.push(Arc::new(MockHarness::builtin()));
    }
    harnesses
}

/// The harnesses the organization's settings offer: the built-in ones and its own agents, after
/// them, those it offers alone, its default first. Without settings, the built-in ones. The mock
/// is offered whatever they say, as it is for the tests alone.
pub fn offered(policy: Option<&Policy>) -> Vec<Arc<dyn AgentHarness>> {
    let mut harnesses = builtin();
    let Some(policy) = policy else {
        return harnesses;
    };
    harnesses.extend(policy.agents.custom.iter().map(|agent| {
        Arc::new(custom_cli::CustomCliHarness::new(agent.clone())) as Arc<dyn AgentHarness>
    }));
    policy.agents.offer.arrange(
        harnesses,
        |harness| harness.descriptor().id,
        |harness| harness.descriptor().id == "mock",
    )
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn ids(harnesses: &[Arc<dyn AgentHarness>]) -> Vec<String> {
        harnesses
            .iter()
            .map(|harness| harness.descriptor().id)
            .filter(|id| id != "mock")
            .collect()
    }

    #[test]
    fn the_organization_offers_its_agents_and_its_default_first() {
        assert_eq!(
            ids(&offered(None)),
            [
                "claude-code",
                "codex-cli",
                "copilot-cli",
                "gemini-cli",
                "grok-cli"
            ]
        );
        let policy = Policy::parse(&json!({
            "version": 1,
            "agents": {
                "offered": ["codex-cli", "acme", "claude-code"],
                "default": "acme",
                "custom": [{ "id": "acme", "name": "Acme", "command": "acme.exe" }]
            }
        }));
        assert_eq!(
            ids(&offered(policy.as_ref())),
            ["acme", "claude-code", "codex-cli"]
        );
        let named = offered(policy.as_ref());
        let acme = named
            .iter()
            .find(|harness| harness.descriptor().id == "acme");
        assert_eq!(
            acme.map(|harness| harness.descriptor().name).as_deref(),
            Some("Acme")
        );
        // None offered: all of them, its own after the app's.
        let every = Policy::parse(&json!({
            "version": 1,
            "agents": { "custom": [{ "id": "acme", "name": "Acme", "command": "acme.exe" }] }
        }));
        assert_eq!(
            ids(&offered(every.as_ref())).last().map(String::as_str),
            Some("acme")
        );
    }
}
