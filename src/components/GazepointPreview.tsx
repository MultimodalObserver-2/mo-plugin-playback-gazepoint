import { useTranslation } from "mo-sdk";

export function GazePointPreview() {
    const { t } = useTranslation("interaction-lab-gazepoint_playback");

    return (
        <div
            style={{
                padding: "16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                background: "#fafafa",
                fontSize: "1.1rem",
                color: "#333",
            }}
        >
            {t("preview_text")}
        </div>
    )
}
