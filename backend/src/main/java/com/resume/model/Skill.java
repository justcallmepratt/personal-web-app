package com.resume.model;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One entry in a profile's skills list, stored inside the profile's JSON column.
 * The level is optional: a skill without one is left out of the JSON entirely,
 * so clients can tell "no level" apart from a level of zero.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Skill {
    private String name;
    private String category;
    private Integer level;

    public Skill() {}

    public Skill(String name, String category) {
        this(name, category, null);
    }

    public Skill(String name, String category, Integer level) {
        this.name = name;
        this.category = category;
        this.level = level;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
}
