//! The Tauri shell of Slidr. The webview owns the model; Rust keeps the files, runs the agent
//! harnesses and captures slides.

mod assets;
mod capture;
mod commands;
mod error;
mod fonts;
mod harness;
mod image_process;
mod image_providers;
mod import_window;
mod media_library;
mod net;
mod secrets;
mod settings;
mod show_screen;
mod stock;
mod storage;
mod system_settings;
mod templates;
mod updates;
// The tool bridge. Its folder is the one place that names the protocol it speaks to agents
// (API-02); the rest of the crate knows it by what it does.
#[path = "mcp_bridge/mod.rs"]
mod tool_bridge;

use std::sync::Arc;

use tauri::Manager;

/// Starts the Tauri application. Blocks until the last window closes.
///
/// # Panics
/// If the webview runtime cannot be initialised; there is nothing to fall back to.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // A link that leaves the app opens in the browser of the system. The capability allows
        // `open_url` for http and https addresses and nothing else of the plugin.
        .plugin(tauri_plugin_opener::init())
        // Updates of the app: found and downloaded while it runs, installed when it exits.
        .plugin(tauri_plugin_updater::Builder::new().build())
        // The icons, the templates and their photographs, the decks' fonts and the content of
        // Elements: the media library, published on the web and kept on this machine.
        .register_asynchronous_uri_scheme_protocol(
            media_library::SCHEME,
            |context, request, responder| {
                let library = context
                    .app_handle()
                    .try_state::<Arc<media_library::MediaLibrary>>()
                    .map(|library| Arc::clone(&library));
                tauri::async_runtime::spawn(async move {
                    responder.respond(match library {
                        Some(library) => library.respond(&request).await,
                        None => media_library::unavailable(),
                    });
                });
            },
        )
        .setup(|app| {
            let root = app.path().app_data_dir()?;
            let base = media_library::base_url();
            let library = manage_library(app, base.clone())?;
            let system = system_settings::SystemSettings::development().unwrap_or_else(|| {
                system_settings::SystemSettings::new(
                    root.join(system_settings::FILE),
                    &app.package_info().version.to_string(),
                    base.as_ref(),
                )
            });
            let harnesses = Arc::new(harness::HarnessManager::new(
                root.join("agent"),
                harness::builtin(),
            ));
            app.manage(Arc::clone(&harnesses));
            app.manage(tool_bridge::ToolBridge::new());
            let (images, stock) = manage_media(app, &root);
            // What the organization offers, now from what was kept, and again once this start
            // has read its library, when it reads it (ADR-117).
            system.apply(move |policy| {
                harnesses.offer(
                    harness::offered(policy),
                    policy.is_none_or(system_settings::Policy::web_allowed),
                );
                images.set_offer(policy.map(|p| p.images.clone()).unwrap_or_default());
                stock.set_offer(policy.map(|p| p.stock.clone()).unwrap_or_default());
            });
            system.start(library);
            app.manage(system);
            app.manage(Arc::new(templates::TemplateStore::new(&root)));
            app.manage(Arc::new(storage::Storage::new(root)));
            app.manage(Arc::new(capture::CaptureService::new()));
            app.manage(Arc::new(import_window::ImportService::new()));
            app.manage(Arc::new(image_process::ImageProcessService::new(
                image_process::places(app)?,
            )));
            updates::start(app.handle());
            Ok(())
        })
        .on_window_event(capture::on_window_event)
        .on_window_event(import_window::on_window_event)
        // Every app command passes the gate: the import window may call only its own few.
        .invoke_handler(import_window::gate(tauri::generate_handler![
            commands::storage_new,
            commands::storage_open,
            commands::storage_write_deck,
            commands::storage_save,
            commands::storage_close,
            commands::storage_list_recoverable,
            commands::storage_recover,
            commands::storage_backup,
            commands::recents_list,
            commands::recents_remove,
            commands::asset_import_file,
            commands::asset_import_bytes,
            commands::export_write_file,
            commands::pptx_read,
            image_providers::ipc::image_providers,
            image_providers::ipc::image_probe,
            image_providers::ipc::image_default_provider,
            image_providers::ipc::image_set_default_provider,
            image_providers::ipc::image_generate,
            image_providers::ipc::image_edit,
            image_providers::ipc::image_cancel,
            harness::ipc::agent_harnesses,
            harness::ipc::agent_probe,
            harness::ipc::agent_connect,
            harness::ipc::agent_install,
            harness::ipc::agent_login,
            harness::ipc::agent_start,
            harness::ipc::agent_send,
            harness::ipc::agent_interrupt,
            harness::ipc::agent_close,
            tool_bridge::ipc::tool_bridge_connect,
            tool_bridge::ipc::tool_bridge_open,
            tool_bridge::ipc::tool_bridge_close,
            tool_bridge::ipc::tool_bridge_reply,
            capture::capture_slide,
            capture::capture_page_loaded,
            capture::capture_ready,
            capture::capture_clip,
            capture::capture_run_job,
            capture::capture_job_take,
            capture::capture_job_done,
            harness::ipc::agent_chat_read,
            harness::ipc::agent_chat_write,
            templates::template_store_list,
            templates::template_store_save,
            templates::template_store_remove,
            templates::template_store_read_asset,
            templates::template_store_write_asset,
            harness::ipc::agent_attach,
            harness::ipc::agent_read_attachment,
            settings::ipc::settings_read,
            settings::ipc::settings_write,
            secrets::ipc::secret_status,
            secrets::ipc::secret_set,
            secrets::ipc::secret_delete,
            stock::ipc::stock_sources,
            stock::ipc::stock_default_source,
            stock::ipc::stock_search,
            stock::ipc::stock_thumbnail,
            stock::ipc::stock_import,
            import_window::import_open,
            import_window::import_run_job,
            import_window::import_blocked,
            import_window::import_close,
            import_window::import_page_loaded,
            import_window::import_job_take,
            import_window::import_job_done,
            import_window::import_source,
            import_window::import_store_asset,
            commands::export_copy_media,
            image_process::ipc::image_process,
            image_process::ipc::image_process_status,
            harness::ipc::agent_diagnostics_read,
            harness::ipc::agent_diagnostics_clear,
            fonts::fonts_system,
            import_window::import_reopen,
            import_window::import_record_read,
            import_window::import_record_write,
            import_window::import_source_export,
            import_window::import_source_remove,
            image_process::ipc::image_upscale,
            image_process::ipc::image_upscale_cancel,
            image_process::ipc::image_upscale_status,
            show_screen::show_screen_set,
            system_settings::system_settings_read,
        ]))
        .build(tauri::generate_context!())
        .expect("failed to start the Slidr application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                updates::install_pending(app);
            }
        });
}

/// The media library at `base`, read from the web into a cache of this machine's own: not of the
/// roaming profile, since all of it is to be had again. None without a library.
fn manage_library(
    app: &tauri::App,
    base: Option<reqwest::Url>,
) -> tauri::Result<Option<Arc<media_library::MediaLibrary>>> {
    let Some(base) = base else {
        return Ok(None);
    };
    let dir = app.path().app_local_data_dir()?.join("media");
    let library = media_library::MediaLibrary::new(base, dir);
    library.start();
    app.manage(Arc::clone(&library));
    Ok(Some(library))
}

/// The settings and the keys, and what reads them: the image providers and the photo libraries
/// (ADR-051), which are given back for what the organization offers of them.
fn manage_media(
    app: &tauri::App,
    root: &std::path::Path,
) -> (Arc<image_providers::ImageService>, Arc<stock::StockService>) {
    let settings = Arc::new(settings::Settings::open(root.join("settings.json")));
    // Keys are kept under the app's identifier, so a development copy has keys of its own and
    // never reads or replaces the user's.
    let secrets = Arc::new(secrets::Secrets::new(secrets::Keychain::new(
        app.config().identifier.clone(),
    )));
    let images = image_providers::ImageService::new(
        Arc::clone(&settings),
        image_providers::builtin(&secrets, &settings),
    );
    images.adopt_legacy_choice(&root.join("image-providers.json"));
    let images = Arc::new(images);
    let stock = Arc::new(stock::StockService::new(
        Arc::clone(&settings),
        stock::builtin(&secrets),
    ));
    app.manage(Arc::clone(&images));
    app.manage(Arc::clone(&stock));
    app.manage(settings);
    app.manage(secrets);
    (images, stock)
}
