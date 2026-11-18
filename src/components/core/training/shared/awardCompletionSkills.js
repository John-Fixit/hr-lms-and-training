/** Normalise skill ids from arrays, objects, or comma-separated strings. */
export function normalizeSkillIds(value) {
  if (value == null || value === "") return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return [
    ...new Set(
      list
        .map((item) => {
          if (item && typeof item === "object") {
            return item.SKILL_ID ?? item.skill_id ?? item.value;
          }
          return item;
        })
        .filter((id) => id !== undefined && id !== null && id !== ""),
    ),
  ];
}

/**
 * Record skills on staff profiles after they complete a course or training.
 * Upserts per staff + skill so repeating completion does not duplicate.
 */
export async function awardSkillsOnCompletion({
  saveStaffSkill,
  staffIds = [],
  skillIds = [],
  source = "HR",
  notes = "",
  level = 3,
}) {
  const people = [...new Set((staffIds || []).filter(Boolean))];
  const skills = normalizeSkillIds(skillIds);
  if (!people.length || !skills.length || !saveStaffSkill) return;

  await Promise.all(
    people.flatMap((staff_id) =>
      skills.map((skill_id) =>
        saveStaffSkill({
          staff_id,
          skill_id,
          skill_level: level,
          level,
          source,
          notes,
          years_experience: 0,
        }).catch(() => null),
      ),
    ),
  );
}

export async function awardSkillsForCompletedTraining({
  row,
  fetchParticipants,
  saveStaffSkill,
}) {
  const skillIds = normalizeSkillIds(
    row?.SKILLS ?? row?.skills ?? row?.SKILL_IDS ?? row?.skill_ids,
  );
  if (!skillIds.length) return;

  let staffIds = [];
  if (typeof fetchParticipants === "function" && row?.TRAINING_ID) {
    try {
      const list = await fetchParticipants({ training_id: row.TRAINING_ID });
      staffIds = (Array.isArray(list) ? list : [])
        .map((staff) => staff?.STAFF_ID)
        .filter(Boolean);
    } catch {
      staffIds = [];
    }
  }

  await awardSkillsOnCompletion({
    saveStaffSkill,
    staffIds,
    skillIds,
    source: "HR",
    notes: `Awarded on completing ${row?.TRAINING_TITLE || row?.COURSE || "training"}`,
  });
}
