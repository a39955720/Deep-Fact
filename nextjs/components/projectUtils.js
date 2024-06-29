// projectUtils.js

export const sortProjectsByTime = (projects, timestamps) => {
    const projectWithTimestamps = projects.map((project, index) => ({
        project,
        timestamp: timestamps[index]
    }))

    projectWithTimestamps.sort((a, b) => b.timestamp - a.timestamp)

    return projectWithTimestamps.map(item => item.project)
}
export const options = [
    { value: 'Sort by Time (Old to New)', label: 'Sort by Time (Old to New)' },
    { value: 'Sort by Time (New to Old)', label: 'Sort by Time (New to Old)' },
    { value: 'Filter by Answered', label: 'Filter by Answered' }
]
export const filterProjectsWithAuditorResponses = (projects, auditors) => {
    return projects.reduce((acc, project, index) => {
        if (auditors[index].some(auditor => auditor !== "0x0000000000000000000000000000000000000000")) {
            acc.push(index);
        }
        return acc;
    }, []);
}