import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Select } from "antd";
import { Plus } from "lucide-react";
import { useGetSkills } from "../../../../API/trainingSkills";
import { buildGroupedSkillOptions } from "../skills/skillsConstants";
import SkillFormDrawer from "../skills/SkillFormDrawer";

/** Optional multi-select of skills awarded when the course/training is completed. */
export default function CourseSkillPicker({
  value,
  onChange,
  size = "large",
  placeholder = "Select skills this awards on completion (optional)",
}) {
  const { data: skills = [], isPending, refetch } = useGetSkills();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreated = async (skillId) => {
    await refetch();
    if (!skillId) return;
    onChange?.([...(value || []).filter((id) => String(id) !== String(skillId)), skillId]);
  };

  return (
    <>
      <Select
        mode="multiple"
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        options={buildGroupedSkillOptions(skills)}
        loading={isPending}
        size={size}
        className="w-full"
        virtual={false}
        maxTagCount="responsive"
        getPopupContainer={() => document.body}
        dropdownStyle={{ zIndex: 2000 }}
        dropdownRender={(menu) => (
          <>
            {menu}
            <div className="border-t border-slate-100 px-2 py-1.5">
              <Button
                type="link"
                className="h-auto px-1"
                icon={<Plus size={14} />}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setCreateOpen(true)}
              >
                Create new skill
              </Button>
            </div>
          </>
        )}
      />
      <SkillFormDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

CourseSkillPicker.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  size: PropTypes.string,
  placeholder: PropTypes.string,
};
